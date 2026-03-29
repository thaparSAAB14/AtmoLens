"""
Land Mask Generator
────────────────────
Generates a binary land mask from Natural Earth 110m coastline data.
Run this script once to create assets/land_mask.png.

If Natural Earth data is not available, generates a simple approximate
mask based on common map extents for ECCC analysis maps.
"""

import logging
import sys
from pathlib import Path

import cv2
import numpy as np

import config

logger = logging.getLogger(__name__)

# Approximate land regions for ECCC surface analysis maps
# These are rough polygon coordinates (x_percent, y_percent) of the image
# representing major North American landmass areas
APPROX_LAND_POLYGONS = [
    # Main North American landmass (rough percentage coordinates)
    # These would need calibration against actual map extents
    [(0.15, 0.10), (0.85, 0.10), (0.85, 0.80), (0.60, 0.90), (0.15, 0.90)],
]


def generate_approximate_mask(
    width: int = 1200, height: int = 800
) -> np.ndarray:
    """
    Generate an approximate land mask based on typical ECCC map extents.
    This is a rough approximation — the pre-built mask from GIS data
    will be far more accurate.
    """
    mask = np.zeros((height, width), dtype=np.uint8)

    for polygon in APPROX_LAND_POLYGONS:
        pts = np.array(
            [(int(x * width), int(y * height)) for x, y in polygon],
            dtype=np.int32,
        )
        cv2.fillPoly(mask, [pts], 255)

    return mask


def generate_from_intensity(
    sample_image_path: str, threshold: int = 200
) -> np.ndarray:
    """
    Generate a land mask from a sample grayscale map image.
    Lighter regions (> threshold) are assumed to be land.
    This is a one-time calibration step.
    """
    img = cv2.imread(sample_image_path, cv2.IMREAD_GRAYSCALE)
    if img is None:
        raise FileNotFoundError(f"Could not load: {sample_image_path}")

    # Blur to remove lines/text
    blurred = cv2.GaussianBlur(img, (21, 21), 0)

    # Threshold: lighter = land
    _, mask = cv2.threshold(blurred, threshold, 255, cv2.THRESH_BINARY)

    # Clean up with morphological operations
    kernel = np.ones((15, 15), np.uint8)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)

    return mask


def save_mask(mask: np.ndarray, output_path: Path = None):
    """Save the land mask to disk."""
    output_path = output_path or config.LAND_MASK_PATH
    output_path.parent.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(output_path), mask)
    logger.info(f"Land mask saved to {output_path} ({mask.shape[1]}x{mask.shape[0]})")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)

    if len(sys.argv) > 1:
        # Generate from a sample image
        sample_path = sys.argv[1]
        threshold = int(sys.argv[2]) if len(sys.argv) > 2 else 200
        print(f"Generating land mask from sample: {sample_path}")
        mask = generate_from_intensity(sample_path, threshold)
    else:
        # Generate approximate mask
        print("Generating approximate land mask (1200x800)")
        print("For better accuracy, run with a sample map image:")
        print("  python land_mask.py path/to/sample_map.gif [threshold]")
        mask = generate_approximate_mask()

    save_mask(mask)
    print(f"✅ Mask saved to {config.LAND_MASK_PATH}")
