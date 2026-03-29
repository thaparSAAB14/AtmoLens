"""
Image Processing Engine
────────────────────────
Converts grayscale ECCC synoptic maps into color-enhanced versions.
Preserves all meteorological features (isobars, labels, fronts)
and applies color only to background regions.
"""

import io
import logging
import time
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

import config

logger = logging.getLogger(__name__)


def load_land_mask() -> np.ndarray | None:
    """
    Load the pre-generated land mask.
    Returns a binary mask where land = 255, water = 0.
    """
    if not config.LAND_MASK_PATH.exists():
        logger.warning(
            f"Land mask not found at {config.LAND_MASK_PATH}. "
            "Will use intensity-based fallback segmentation."
        )
        return None

    mask = cv2.imread(str(config.LAND_MASK_PATH), cv2.IMREAD_GRAYSCALE)
    if mask is None:
        logger.warning("Failed to load land mask image.")
        return None

    return mask


# Cache the land mask on module load
_land_mask = load_land_mask()


def _bytes_to_cv2(raw_bytes: bytes) -> np.ndarray:
    """Convert raw image bytes (GIF/PNG/JPEG) to OpenCV BGR numpy array."""
    # Use Pillow to handle GIF (OpenCV can't read GIF natively)
    pil_img = Image.open(io.BytesIO(raw_bytes))
    pil_img = pil_img.convert("RGB")
    arr = np.array(pil_img)
    # Convert RGB to BGR for OpenCV
    return cv2.cvtColor(arr, cv2.COLOR_RGB2BGR)


def _cv2_to_bytes(img: np.ndarray, fmt: str = ".png") -> bytes:
    """Convert OpenCV BGR image to PNG bytes."""
    success, buffer = cv2.imencode(fmt, img)
    if not success:
        raise RuntimeError("Failed to encode image")
    return buffer.tobytes()


def extract_foreground(gray: np.ndarray) -> np.ndarray:
    """
    Extract foreground elements (isobars, text, weather symbols).
    Returns a binary mask where foreground = 255, background = 0.
    """
    # Threshold: dark pixels (< threshold) are foreground
    _, foreground_mask = cv2.threshold(
        gray, config.FOREGROUND_THRESHOLD, 255, cv2.THRESH_BINARY_INV
    )

    # Also use edge detection to catch lighter lines
    edges = cv2.Canny(gray, 50, 150)

    # Combine both masks
    combined = cv2.bitwise_or(foreground_mask, edges)

    # Slight dilation to protect text/line edges from color bleed
    kernel = np.ones((2, 2), np.uint8)
    combined = cv2.dilate(combined, kernel, iterations=1)

    return combined


def segment_land_water(
    gray: np.ndarray, foreground_mask: np.ndarray
) -> tuple[np.ndarray, np.ndarray]:
    """
    Segment background into land and water regions.
    Returns (land_mask, water_mask) as binary masks.
    """
    global _land_mask

    # Background = everything NOT foreground
    background_mask = cv2.bitwise_not(foreground_mask)

    if _land_mask is not None:
        # Use the pre-generated land mask (most accurate)
        # Resize to match the input image dimensions
        land_ref = cv2.resize(
            _land_mask, (gray.shape[1], gray.shape[0]), interpolation=cv2.INTER_NEAREST
        )
        land_mask = cv2.bitwise_and(land_ref, background_mask)
        water_mask = cv2.bitwise_and(cv2.bitwise_not(land_ref), background_mask)
    else:
        # Fallback: intensity-based segmentation
        # Lighter background regions → land, darker → water
        # Apply adaptive thresholding
        blurred = cv2.GaussianBlur(gray, (15, 15), 0)

        # Use Otsu's threshold to find a good split point
        threshold_val, _ = cv2.threshold(
            blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU
        )

        # Adjust threshold to be slightly above midpoint for better segmentation
        adjusted_threshold = min(threshold_val + 20, 240)

        land_mask = np.zeros_like(gray)
        water_mask = np.zeros_like(gray)

        # Background pixels above threshold → land (lighter)
        # Background pixels below threshold → water (darker)
        land_pixels = (gray >= adjusted_threshold) & (background_mask > 0)
        water_pixels = (gray < adjusted_threshold) & (background_mask > 0)

        land_mask[land_pixels] = 255
        water_mask[water_pixels] = 255

    return land_mask, water_mask


def apply_colors(
    original_bgr: np.ndarray,
    foreground_mask: np.ndarray,
    land_mask: np.ndarray,
    water_mask: np.ndarray,
) -> np.ndarray:
    """
    Apply colors to background while preserving the original foreground.
    """
    # Start with the original image
    result = original_bgr.copy()

    # Apply water color (BGR)
    result[water_mask > 0] = config.WATER_COLOR

    # Apply land color (BGR)
    result[land_mask > 0] = config.LAND_COLOR

    # Restore original foreground on top
    result[foreground_mask > 0] = original_bgr[foreground_mask > 0]

    return result


def smooth_color_boundaries(colored: np.ndarray, foreground_mask: np.ndarray) -> np.ndarray:
    """
    Apply subtle Gaussian blur only to background color boundaries
    for a smoother, more polished look.
    """
    # Blur the background
    blurred = cv2.GaussianBlur(colored, (5, 5), 0)

    # Keep original foreground sharp, use blurred background
    result = blurred.copy()
    result[foreground_mask > 0] = colored[foreground_mask > 0]

    return result


def process_image(raw_bytes: bytes) -> bytes:
    """
    Main processing pipeline.
    Takes raw image bytes, returns enhanced PNG bytes.

    Pipeline:
    1. Load image
    2. Convert to grayscale
    3. Reduce noise
    4. Extract foreground (isobars, text, symbols)
    5. Segment background into land/water
    6. Apply colors
    7. Smooth boundaries
    8. Export as high-res PNG
    """
    start = time.perf_counter()

    # Step 1: Load
    bgr = _bytes_to_cv2(raw_bytes)
    logger.info(f"Image loaded: {bgr.shape[1]}x{bgr.shape[0]}")

    # Step 2: Convert to grayscale
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)

    # Step 3: Reduce noise
    gray_smooth = cv2.GaussianBlur(gray, (3, 3), 0)

    # Step 4: Extract foreground
    foreground_mask = extract_foreground(gray_smooth)

    # Step 5: Segment land vs water
    land_mask, water_mask = segment_land_water(gray_smooth, foreground_mask)

    # Step 6: Apply colors
    colored = apply_colors(bgr, foreground_mask, land_mask, water_mask)

    # Step 7: Smooth color boundaries
    result = smooth_color_boundaries(colored, foreground_mask)

    # Step 8: Export
    output_bytes = _cv2_to_bytes(result)

    elapsed = time.perf_counter() - start
    logger.info(f"Processing completed in {elapsed:.2f}s")

    return output_bytes


def convert_original_to_png(raw_bytes: bytes) -> bytes:
    """
    Convert the original image (may be GIF) to PNG for consistent storage.
    """
    pil_img = Image.open(io.BytesIO(raw_bytes))
    pil_img = pil_img.convert("RGB")
    buf = io.BytesIO()
    pil_img.save(buf, format="PNG")
    return buf.getvalue()
