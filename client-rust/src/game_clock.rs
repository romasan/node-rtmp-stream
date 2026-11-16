use crate::rich_text::escape_markdown;

pub fn cooldown_label(seconds: u64) -> String {
    format!("{:02}:{:02}", seconds / 60, seconds % 60)
}

pub fn season_label(seconds: u64) -> String {
    let hours = seconds / 3600;
    let days = hours / 24;
    let mut label = if days > 0 {
        format!("{days} д. ")
    } else {
        String::new()
    };
    if hours > 0 {
        label.push_str(&format!("{:02}:", hours % 24));
    }
    label.push_str(&cooldown_label(seconds % 3600));
    label
}

pub fn finish_markdown(raw: &str) -> String {
    let mut output = String::new();
    let mut tail = raw;
    while let Some((before, candidate)) = tail.split_once('(') {
        escape_markdown(&mut output, before);
        if let Some((label, target)) = candidate.split_once(")[")
            && let Some((url, after)) = target.split_once(']')
            && !label.is_empty()
            && label.chars().all(|c| c.is_alphanumeric() || c == ' ')
            && (url.starts_with("https://") || url.starts_with("http://"))
            && url
                .bytes()
                .all(|c| c.is_ascii_alphanumeric() || b":/-.@".contains(&c))
        {
            output.push('[');
            escape_markdown(&mut output, label);
            output.push_str("](");
            output.push_str(url);
            output.push(')');
            tail = after;
        } else {
            output.push_str("\\(");
            tail = candidate;
        }
    }
    escape_markdown(&mut output, tail);
    output
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn formats_cooldown_and_season_timer_independently() {
        assert_eq!(cooldown_label(3661), "61:01");
        assert_eq!(season_label(3661), "01:01:01");
        assert_eq!(season_label(90061), "1 д. 01:01:01");
        assert_eq!(season_label(5), "00:05");
    }

    #[test]
    fn finish_message_restores_server_links_and_escapes_plain_text() {
        assert_eq!(
            finish_markdown("Игра! (тут)[https://pixelbattles.ru/timelapse/]"),
            r"Игра\! [тут](https://pixelbattles.ru/timelapse/)"
        );
        assert_eq!(
            finish_markdown("[open](javascript:foo)"),
            r"\[open\]\(javascript\:foo\)"
        );
    }
}
