"""
🖼️ Image Processing Engine (Vercel Native)
────────────────────────────────────────
Converts grayscale ECCC synoptic maps into color-enhanced versions.
Preserves all meteorological features (isobars, labels, fronts)
and applies color only to background regions.
"""

import io
import logging
import time

import cv2
import numpy as np
from PIL import Image

import api.config as config

logger = logging.getLogger(__name__)

def _bytes_to_cv2(raw_bytes: bytes) -> np.ndarray:
    """Convert raw image bytes (GIF/PNG/JPEG) to OpenCV BGR numpy array."""
    pil_img = Image.open(io.BytesIO(raw_bytes))
    pil_img = pil_img.convert("RGB")
    arr = np.array(pil_img)
    return cv2.cvtColor(arr, cv2.COLOR_RGB2BGR)

def _cv2_to_bytes(img: np.ndarray, fmt: str = ".png") -> bytes:
    """Convert OpenCV BGR image to PNG bytes."""
    success, buffer = cv2.imencode(fmt, img)
    if not success:
        raise RuntimeError("Failed to encode image")
    return buffer.tobytes()

def extract_foreground(gray: np.ndarray) -> np.ndarray:
    """Extract foreground elements (isobars, text, weather symbols)."""
    _, foreground_mask = cv2.threshold(
        gray, config.FOREGROUND_THRESHOLD, 255, cv2.THRESH_BINARY_INV
    )
    edges = cv2.Canny(gray, 50, 150)
    combined = cv2.bitwise_or(foreground_mask, edges)
    kernel = np.ones((2, 2), np.uint8)
    combined = cv2.dilate(combined, kernel, iterations=1)
    return combined

def segment_land_water(gray: np.ndarray, foreground_mask: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """Segment background into land and water regions via intensity fallback."""
    background_mask = cv2.bitwise_not(foreground_mask)
    blurred = cv2.GaussianBlur(gray, (15, 15), 0)
    threshold_val, _ = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    adjusted_threshold = min(threshold_val + 20, 240)
    
    land_mask = np.zeros_like(gray)
    water_mask = np.zeros_like(gray)
    land_pixels = (gray >= adjusted_threshold) & (background_mask > 0)
    water_pixels = (gray < adjusted_threshold) & (background_mask > 0)
    land_mask[land_pixels] = 255
    water_mask[water_pixels] = 255
    
    return land_mask, water_mask

def apply_colors(original_bgr: np.ndarray, foreground_mask: np.ndarray, land_mask: np.ndarray, water_mask: np.ndarray) -> np.ndarray:
    """Apply 'Bit Depth' colors while preserving the original foreground."""
    result = original_bgr.copy()
    result[water_mask > 0] = config.WATER_COLOR
    result[land_mask > 0] = config.LAND_COLOR
    result[foreground_mask > 0] = original_bgr[foreground_mask > 0]
    return result

def smooth_color_boundaries(colored: np.ndarray, foreground_mask: np.ndarray) -> np.ndarray:
    """Apply subtle Gaussian blur to background color boundaries."""
    blurred = cv2.GaussianBlur(colored, (5, 5), 0)
    result = blurred.copy()
    result[foreground_mask > 0] = colored[foreground_mask > 0]
    return result

def process_image(raw_bytes: bytes) -> bytes:
    """Main processing pipeline for Vercel Functions."""
    start = time.perf_counter()
    bgr = _bytes_to_cv2(raw_bytes)
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
    gray_smooth = cv2.GaussianBlur(gray, (3, 3), 0)
    foreground_mask = extract_foreground(gray_smooth)
    land_mask, water_mask = segment_land_water(gray_smooth, foreground_mask)
    colored = apply_colors(bgr, foreground_mask, land_mask, water_mask)
    result = smooth_color_boundaries(colored, foreground_mask)
    output_bytes = _cv2_to_bytes(result)
    elapsed = time.perf_counter() - start
    logger.info(f"Processing completed in {elapsed:.2f}s")
    return output_bytes

def convert_original_to_png(raw_bytes: bytes) -> bytes:
    """Convert original GIF to PNG for cloud storage."""
    pil_img = Image.open(io.BytesIO(raw_bytes))
    pil_img = pil_img.convert("RGB")
    buf = io.BytesIO()
    pil_img.save(buf, format="PNG")
    return buf.getvalue()
