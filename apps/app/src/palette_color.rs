pub fn parse_hex(text: &str) -> Option<u32> {
    let hex = text.trim().strip_prefix('#')?;
    if !hex.bytes().all(|digit| digit.is_ascii_hexdigit()) {
        return None;
    }
    let value = u32::from_str_radix(hex, 16).ok()?;
    match hex.len() {
        3 => {
            Some(((value >> 8) * 17 << 16) | (((value >> 4) & 15) * 17 << 8) | ((value & 15) * 17))
        }
        6 => Some(value),
        _ => None,
    }
}

pub fn hsv(rgb: u32) -> (f32, f32, f32) {
    let [_, r, g, b] = rgb.to_be_bytes();
    let (r, g, b) = (r as f32 / 255.0, g as f32 / 255.0, b as f32 / 255.0);
    let value = r.max(g).max(b);
    let chroma = value - r.min(g).min(b);
    if chroma == 0.0 {
        return (0.0, 0.0, value);
    }
    let hue = if value == r {
        (g - b) / chroma
    } else if value == g {
        (b - r) / chroma + 2.0
    } else {
        (r - g) / chroma + 4.0
    };
    (hue.rem_euclid(6.0) / 6.0, chroma / value, value)
}

pub fn rgb(hue: f32, saturation: f32, value: f32) -> u32 {
    let sector = hue.rem_euclid(1.0) * 6.0;
    let chroma = saturation * value;
    let secondary = chroma * (1.0 - (sector.rem_euclid(2.0) - 1.0).abs());
    let (r, g, b) = match sector as u32 {
        0 => (chroma, secondary, 0.0),
        1 => (secondary, chroma, 0.0),
        2 => (0.0, chroma, secondary),
        3 => (0.0, secondary, chroma),
        4 => (secondary, 0.0, chroma),
        _ => (chroma, 0.0, secondary),
    };
    let channel = |c: f32| ((c + value - chroma) * 255.0_f32).round() as u32;
    channel(r) << 16 | channel(g) << 8 | channel(b)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn accepts_short_hex_and_round_trips_picker_positions() {
        assert_eq!(parse_hex("#aF0"), Some(0xaaff00));
        assert_eq!(parse_hex("#+1"), None);
        for original in [0, 0xffffff, 0x808080, 0xff0050, 0x42b3ff, 0x05ff43] {
            let (h, s, v) = hsv(original);
            assert_eq!(rgb(h, s, v), original);
        }
    }
}
