import numpy as np
import cv2


class BoardDetectionError(Exception):
    pass


def order_points(pts: np.ndarray) -> np.ndarray:
    """Order points as: top-left, top-right, bottom-right, bottom-left."""
    rect = np.zeros((4, 2), dtype="float32")
    s = pts.sum(axis=1)
    diff = np.diff(pts, axis=1)
    rect[0] = pts[np.argmin(s)]      # top-left
    rect[2] = pts[np.argmax(s)]      # bottom-right
    rect[1] = pts[np.argmin(diff)]   # top-right
    rect[3] = pts[np.argmax(diff)]   # bottom-left
    return rect


def four_point_transform(image: np.ndarray, pts: np.ndarray) -> np.ndarray:
    """Apply perspective transform to extract the board region."""
    rect = order_points(pts)
    (tl, tr, br, bl) = rect

    width = max(int(np.linalg.norm(br - bl)), int(np.linalg.norm(tr - tl)))
    height = max(int(np.linalg.norm(tr - br)), int(np.linalg.norm(tl - bl)))

    dst = np.array([
        [0, 0],
        [width - 1, 0],
        [width - 1, height - 1],
        [0, height - 1],
    ], dtype="float32")

    M = cv2.getPerspectiveTransform(rect, dst)
    return cv2.warpPerspective(image, M, (width, height))


def find_board_contour(contours: list) -> np.ndarray | None:
    """Find the largest quadrilateral contour that looks like a chessboard."""
    board_contour = None
    max_area = 0
    for cnt in contours:
        epsilon = 0.01 * cv2.arcLength(cnt, True)
        approx = cv2.approxPolyDP(cnt, epsilon, True)
        area = cv2.contourArea(cnt)
        if len(approx) == 4:
            x, y, w, h = cv2.boundingRect(approx)
            aspect_ratio = w / float(h)
            if 0.8 < aspect_ratio < 1.2 and area > max_area:
                max_area = area
                board_contour = approx
    return board_contour


def _detect_with_hough(
    gray: np.ndarray, threshold: int
) -> np.ndarray | None:
    """Try to detect board using Hough line transform at given threshold."""
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(blurred, 50, 150)
    kernel = np.ones((3, 3), np.uint8)
    edges_dilated = cv2.dilate(edges, kernel, iterations=2)

    lines_img = np.zeros_like(edges_dilated)
    lines = cv2.HoughLinesP(
        edges_dilated, 1, np.pi / 180,
        threshold=threshold, minLineLength=100, maxLineGap=30,
    )
    if lines is None:
        return None

    for line in lines:
        x1, y1, x2, y2 = line[0]
        cv2.line(lines_img, (x1, y1), (x2, y2), 255, 2)

    lines_dilated = cv2.dilate(lines_img, kernel, iterations=1)
    contours, _ = cv2.findContours(
        lines_dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
    )

    board_contour = find_board_contour(contours)
    if board_contour is not None:
        return board_contour

    # Fallback: draw bounding rect around all detected lines
    y_indices, x_indices = np.where(lines_dilated == 255)
    if len(x_indices) == 0:
        return None

    all_points = np.column_stack((x_indices, y_indices))
    x, y, w, h = cv2.boundingRect(all_points)
    cv2.rectangle(lines_dilated, (x, y), (x + w, y + h), 255, 3)
    contours, _ = cv2.findContours(
        lines_dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
    )
    return find_board_contour(contours)


def detect_board(
    image_bytes: bytes,
    manual_corners: list[list[float]] | None = None,
) -> tuple[np.ndarray, list[np.ndarray]]:
    """Detect the chessboard and return (warped_640x640, list_of_64_squares).

    Args:
        image_bytes: Raw image file bytes.
        manual_corners: Optional 4 corner points [[x,y], ...] in order:
            top-left, top-right, bottom-right, bottom-left.

    Returns:
        Tuple of (warped board image 640x640, list of 64 square images 80x80).

    Raises:
        BoardDetectionError if the board cannot be found.
    """
    arr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise BoardDetectionError("Could not decode image.")

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    if manual_corners is not None:
        pts = np.array(manual_corners, dtype="float32")
        warped = four_point_transform(gray, pts)
    else:
        # Adaptive Hough: try decreasing thresholds
        board_contour = None
        for threshold in [290, 200, 150]:
            board_contour = _detect_with_hough(gray, threshold)
            if board_contour is not None:
                break

        if board_contour is None:
            # Last resort: contour-based detection on raw edges
            blurred = cv2.GaussianBlur(gray, (5, 5), 0)
            edges = cv2.Canny(blurred, 50, 150)
            kernel = np.ones((3, 3), np.uint8)
            edges = cv2.dilate(edges, kernel, iterations=2)
            contours, _ = cv2.findContours(
                edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
            )
            board_contour = find_board_contour(contours)

        if board_contour is None:
            raise BoardDetectionError(
                "Could not detect board. Try selecting corners manually."
            )

        warped = four_point_transform(gray, board_contour.reshape(4, 2))

    # Resize to 640x640 for clean 80x80 square extraction
    board = cv2.resize(warped, (640, 640))

    # Split into 8x8 grid
    sq_size = 80
    squares = []
    for row in range(8):
        for col in range(8):
            y1 = row * sq_size
            x1 = col * sq_size
            square = board[y1 : y1 + sq_size, x1 : x1 + sq_size]
            squares.append(square)

    return board, squares
