import os
import sys
import numpy as np
from PIL import Image, ImageFilter, ImageDraw

def run():
    src_path = os.path.join("client", "public", "brand", "wingly-source.png")
    if not os.path.exists(src_path):
        raise FileNotFoundError(f"Source logo not found at {src_path}")

    brand_dir = os.path.join("client", "public", "brand")
    public_dir = os.path.join("client", "public")
    test_dir = os.path.join("scripts", "test_output")
    os.makedirs(brand_dir, exist_ok=True)
    os.makedirs(test_dir, exist_ok=True)

    im_src = Image.open(src_path).convert("RGB")
    src_w, src_h = im_src.size
    print(f"Loaded source image: {src_w}x{src_h}")

    arr = np.array(im_src, dtype=np.float32)

    # 1. Color-to-alpha:
    # alpha = 1 - min(r,g,b)/255 (distance from white)
    # un-premultiply against white:
    # c = (pixel - (1 - alpha) * 255) / alpha
    min_rgb = np.min(arr, axis=2)
    alpha = 1.0 - (min_rgb / 255.0)

    # Clean un-premultiplication:
    # Where alpha is close to 0, color is 0
    safe_alpha = np.maximum(alpha, 1e-4)[:, :, None]
    unpremult_color = (arr - (1.0 - alpha[:, :, None]) * 255.0) / safe_alpha
    unpremult_color = np.clip(unpremult_color, 0.0, 255.0)
    unpremult_color[alpha < 1e-4] = 0.0

    # 2. Ground shadow removal & faint noise cleanup:
    # Swoosh ends at y=429. Below y=429 across the bottom is ground shadow.
    # In addition, under the W ribbon (x in [100, 420]), ground shadow exists below the ribbon.
    # Let's find the solid logo bottom contour (alpha > 0.40):
    logo_bottom = np.zeros(src_w, dtype=int)
    for x in range(src_w):
        ys = np.where(alpha[:, x] > 0.40)[0]
        if len(ys) > 0:
            logo_bottom[x] = ys.max()
        else:
            logo_bottom[x] = 0

    # Clean alpha map:
    clean_alpha = alpha.copy()

    # For any pixel below y=429 (bottom shadow band below swoosh),
    # zero alpha completely since the lowest logo artwork is at y=429:
    clean_alpha[430:, :] = 0.0

    # In the bottom band between logo_bottom and 430, remove pixels with alpha < 0.15:
    for x in range(src_w):
        lb = logo_bottom[x]
        if lb > 0:
            # Below the contour + 2px antialias margin:
            for y in range(lb + 3, 430):
                if clean_alpha[y, x] < 0.35:
                    clean_alpha[y, x] = 0.0

    # Small alpha threshold/curve elsewhere so faint background noise disappears:
    # alpha < 0.06 -> 0
    clean_alpha[clean_alpha < 0.06] = 0.0

    # Smooth curve for subtle noise (0.06 to 0.12 smoothly ramped to full):
    noise_ramp = (clean_alpha >= 0.06) & (clean_alpha < 0.12)
    clean_alpha[noise_ramp] = (clean_alpha[noise_ramp] - 0.06) / (0.12 - 0.06) * clean_alpha[noise_ramp]

    # Zero out zero-alpha color pixels
    unpremult_color[clean_alpha <= 0.0] = 0.0

    # 3. Light feathering:
    # slightly blur only the alpha channel (radius ~0.6px) so edges stay smooth, not jagged.
    alpha_img = Image.fromarray((clean_alpha * 255.0).astype(np.uint8), mode="L")
    alpha_blurred = alpha_img.filter(ImageFilter.GaussianBlur(radius=0.6))
    clean_alpha_blurred = np.array(alpha_blurred, dtype=np.float32) / 255.0

    # Assemble RGBA
    rgba_arr = np.zeros((src_h, src_w, 4), dtype=np.uint8)
    rgba_arr[:, :, :3] = np.round(unpremult_color).astype(np.uint8)
    rgba_arr[:, :, 3] = np.round(clean_alpha_blurred * 255.0).astype(np.uint8)

    full_logo_img = Image.fromarray(rgba_arr, mode="RGBA")

    # 4. Trim to alpha bounding box with about 4% padding:
    bbox = full_logo_img.getbbox()
    print(f"Alpha bbox: {bbox}")
    bx0, by0, bx1, by1 = bbox
    bw = bx1 - bx0
    bh = by1 - by0
    pad_x = int(round(bw * 0.04))
    pad_y = int(round(bh * 0.04))

    crop_x0 = max(0, bx0 - pad_x)
    crop_y0 = max(0, by0 - pad_y)
    crop_x1 = min(src_w, bx1 + pad_x)
    crop_y1 = min(src_h, by1 + pad_y)

    cropped_logo = full_logo_img.crop((crop_x0, crop_y0, crop_x1, crop_y1))
    cw, ch = cropped_logo.size
    print(f"Trimmed logo size: {cw}x{ch}")

    # Scale to ~1200px wide for standard wingly-logo.png, and ~2000px wide for @2x:
    target_1x_w = 1200
    target_1x_h = int(round(ch * (target_1x_w / cw)))
    logo_1x = cropped_logo.resize((target_1x_w, target_1x_h), Image.Resampling.LANCZOS)

    target_2x_w = 2000
    target_2x_h = int(round(ch * (target_2x_w / cw)))
    logo_2x = cropped_logo.resize((target_2x_w, target_2x_h), Image.Resampling.LANCZOS)

    # 5. Create wingly-mark.png (wing 'W' only, square, transparent)
    # Wing 'W' only: in source coords, wing feathers span x in [50, 442], y in [80, 400].
    # Exclude cap (x > 380, y < 220), swoosh (x > 330, y >= 365), and letters (x > 442).
    mark_arr = np.array(full_logo_img).copy()
    mark_arr[:, 442:, 3] = 0
    mark_arr[:220, 380:, 3] = 0
    mark_arr[365:, 330:, 3] = 0
    mark_img_raw = Image.fromarray(mark_arr, mode="RGBA")
    m_bbox = mark_img_raw.getbbox()
    mark_cropped = mark_img_raw.crop(m_bbox)
    mw, mh = mark_cropped.size
    pad = int(round(max(mw, mh) * 0.08))
    side = max(mw, mh) + pad * 2
    mark_square = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    paste_x = (side - mw) // 2
    paste_y = (side - mh) // 2
    mark_square.paste(mark_cropped, (paste_x, paste_y), mark_cropped)
    # Standard 512x512 mark
    mark_512 = mark_square.resize((512, 512), Image.Resampling.LANCZOS)

    # 6. Dark mode wordmark (wingly-logo-dark.png):
    # Recolor ONLY the dark navy wordmark pixels in cropped_logo (and logo_1x, logo_2x)
    # The wordmark letters are navy (R < 65, G < 65, B < 150, lum < 90)
    # in the wordmark region (right of W, below cap).
    # Replace their RGB with near-white #eef2ff ([238, 242, 255]).
    def make_dark_logo(src_logo):
        arr_dark = np.array(src_logo, dtype=np.float32)
        lw, lh = src_logo.size

        r = arr_dark[:, :, 0]
        g = arr_dark[:, :, 1]
        b = arr_dark[:, :, 2]
        a = arr_dark[:, :, 3]

        y_coords, x_coords = np.mgrid[0:lh, 0:lw]
        
        # Wordmark zones:
        # i, n: x in [0.428, 0.68], y in [0.48, 0.88] (below cap and i-sphere, right of W)
        # g, l, y: x in [0.68, 0.805], y in [0.32, 0.89] (includes tall 'l', excludes swoosh below g at y > 0.89 and right of y at x > 0.805)
        zone_i_n   = (x_coords >= int(lw * 0.428)) & (x_coords < int(lw * 0.68)) & \
                     (y_coords >= int(lh * 0.48)) & (y_coords <= int(lh * 0.88))
        zone_g_l_y = (x_coords >= int(lw * 0.68)) & (x_coords <= int(lw * 0.805)) & \
                     (y_coords >= int(lh * 0.32)) & (y_coords <= int(lh * 0.89))
        
        wordmark_zone = zone_i_n | zone_g_l_y

        # Wordmark letters are navy: r < 65, g < 65, (b < 165 or (r < 35 and b < 240)), alpha > 15
        is_letter = wordmark_zone & (a > 15.0) & (r < 65.0) & (g < 65.0) & ((b < 165.0) | ((r < 35.0) & (b < 240.0)))

        # Target near-white: #eef2ff -> [238, 242, 255]
        target_rgb = np.array([238.0, 242.0, 255.0], dtype=np.float32)

        # Set all letter pixels (and their antialiased alpha edges) to the target near-white
        arr_dark[is_letter, :3] = target_rgb

        # Smooth transition on subtle outer antialias fringes
        edge_fringe = wordmark_zone & (~is_letter) & (a > 5.0) & (r < 85.0) & (g < 85.0) & (b < 240.0)
        if np.any(edge_fringe):
            blend = np.clip(1.0 - (r[edge_fringe] / 85.0), 0.0, 1.0)[:, None]
            arr_dark[edge_fringe, :3] = (1.0 - blend) * arr_dark[edge_fringe, :3] + blend * target_rgb

        return Image.fromarray(np.round(arr_dark).astype(np.uint8), mode="RGBA")

    logo_dark_1x = make_dark_logo(logo_1x)
    logo_dark_2x = make_dark_logo(logo_2x)

    # 7. Save brand assets
    paths_to_save = [
        ("wingly-logo.png", logo_1x),
        ("wingly-logo@2x.png", logo_2x),
        ("wingly-mark.png", mark_512),
        ("wingly-logo-dark.png", logo_dark_1x),
        ("wingly-logo-dark@2x.png", logo_dark_2x),
    ]

    for fname, img in paths_to_save:
        out_png = os.path.join(brand_dir, fname)
        img.save(out_png, format="PNG", optimize=True)
        out_webp = os.path.splitext(out_png)[0] + ".webp"
        img.save(out_webp, format="WEBP", lossless=True)
        print(f"Saved {out_png} ({img.size}) and {out_webp}")

    # 8. Favicons and social
    # favicon.ico: 16x16, 32x32, 48x48 from mark_512
    ico_path = os.path.join(public_dir, "favicon.ico")
    mark_512.save(ico_path, format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])
    print(f"Saved {ico_path}")

    # favicon.png (32x32)
    fav_png_path = os.path.join(public_dir, "favicon.png")
    mark_512.resize((32, 32), Image.Resampling.LANCZOS).save(fav_png_path, format="PNG")
    print(f"Saved {fav_png_path}")

    # apple-touch-icon.png (180x180, mark on solid #ffffff background)
    apple_icon = Image.new("RGB", (180, 180), (255, 255, 255))
    mark_144 = mark_512.resize((144, 144), Image.Resampling.LANCZOS)
    apple_icon.paste(mark_144, (18, 18), mark_144)
    apple_path = os.path.join(public_dir, "apple-touch-icon.png")
    apple_icon.save(apple_path, format="PNG")
    print(f"Saved {apple_path}")

    # android-chrome-192x192.png & android-chrome-512x512.png
    ac192_path = os.path.join(public_dir, "android-chrome-192x192.png")
    mark_512.resize((192, 192), Image.Resampling.LANCZOS).save(ac192_path, format="PNG")
    ac512_path = os.path.join(public_dir, "android-chrome-512x512.png")
    mark_512.save(ac512_path, format="PNG")
    print(f"Saved {ac192_path} and {ac512_path}")

    # og-image.png (1200x630, full logo centered on a clean white-to-lavender gradient)
    # Lavender gradient from #ffffff to #ede9fe
    og_img = Image.new("RGB", (1200, 630), (255, 255, 255))
    draw = ImageDraw.Draw(og_img)
    # Smooth vertical gradient #ffffff (top) to #f3f0ff (bottom)
    for y in range(630):
        t = y / 629.0
        r = int(round(255 * (1.0 - t) + 243 * t))
        g = int(round(255 * (1.0 - t) + 240 * t))
        b = int(round(255 * (1.0 - t) + 255 * t))
        draw.line([(0, y), (1200, y)], fill=(r, g, b))

    # Center logo_1x (resize to ~780px wide for balanced OG layout)
    og_logo_w = 780
    og_logo_h = int(round(logo_1x.height * (og_logo_w / logo_1x.width)))
    og_logo = logo_1x.resize((og_logo_w, og_logo_h), Image.Resampling.LANCZOS)
    og_paste_x = (1200 - og_logo_w) // 2
    og_paste_y = (630 - og_logo_h) // 2
    og_img.paste(og_logo, (og_paste_x, og_paste_y), og_logo)
    og_path = os.path.join(public_dir, "og-image.png")
    og_img.save(og_path, format="PNG", quality=95)
    print(f"Saved {og_path}")

    # 9. Verification composites:
    # Composite the PNG over:
    # a. solid #ffffff
    # b. solid #0b1020 (dark navbar)
    # c. solid #f5f3ff (lavender page)
    # d. violet gradient
    # And check dark-mode logo over #0b1020
    test_specs = [
        ("test_composite_white.png", logo_1x, "solid", (255, 255, 255)),
        ("test_composite_dark_navbar.png", logo_dark_1x, "solid", (11, 16, 32)),
        ("test_composite_lavender.png", logo_1x, "solid", (245, 243, 255)),
        ("test_composite_violet_gradient.png", logo_dark_1x, "gradient", ((79, 70, 229), (124, 58, 237))),
    ]

    for name, logo, bg_type, bg_val in test_specs:
        vw, vh = logo.width + 100, logo.height + 100
        canvas = Image.new("RGB", (vw, vh), (255, 255, 255))
        if bg_type == "solid":
            ImageDraw.Draw(canvas).rectangle([(0, 0), (vw, vh)], fill=bg_val)
        else:
            c1, c2 = bg_val
            draw = ImageDraw.Draw(canvas)
            for y in range(vh):
                t = y / max(1, vh - 1)
                r = int(round(c1[0]*(1-t) + c2[0]*t))
                g = int(round(c1[1]*(1-t) + c2[1]*t))
                b = int(round(c1[2]*(1-t) + c2[2]*t))
                draw.line([(0, y), (vw, y)], fill=(r, g, b))

        canvas.paste(logo, (50, 50), logo)
        out_v = os.path.join(test_dir, name)
        canvas.save(out_v)
        print(f"Saved verification preview: {out_v}")

    # Assert corner pixels have alpha == 0
    c_arr = np.array(logo_1x)[:, :, 3]
    corners = [
        ("top-left", c_arr[0, 0]),
        ("top-right", c_arr[0, -1]),
        ("bottom-left", c_arr[-1, 0]),
        ("bottom-right", c_arr[-1, -1]),
    ]
    print("\n--- Verification Checklist ---")
    all_zero = True
    for c_name, val in corners:
        print(f"Corner {c_name} alpha: {val}")
        if val != 0:
            all_zero = False
    assert all_zero, "Error: Corner pixels have non-zero alpha!"
    print("SUCCESS: All corner pixels have alpha == 0.")
    print(f"Final 1x logo size: {logo_1x.size}")
    print(f"Final 2x logo size: {logo_2x.size}")
    print(f"Final mark size: {mark_512.size}")

if __name__ == "__main__":
    run()
