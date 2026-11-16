#[cfg(any(test, target_arch = "wasm32"))]
use std::sync::LazyLock;

#[cfg(any(test, target_arch = "wasm32"))]
use regex::Regex;

#[cfg(any(test, target_arch = "wasm32"))]
static CHAT_LINK: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(concat!(
        r"(?i)https://(?:www\.youtube\.com/(?:watch\?v=[a-z0-9_]+|@[a-z0-9_-]+)",
        r"|youtu\.be/[a-z0-9_-]+|(?:pixelbattles\.ru|discord\.gg|www\.twitch\.tv)/[a-z0-9_/-]*)"
    ))
    .expect("chat URL pattern")
});

pub fn escape_markdown(out: &mut String, text: &str) {
    for character in text.chars() {
        if character.is_ascii_punctuation() {
            out.push('\\');
        }
        out.push(character);
    }
}

#[cfg(any(test, target_arch = "wasm32"))]
pub fn chat_mentions(nickname: &str) -> Option<Regex> {
    if nickname.is_empty() {
        return None;
    }
    Regex::new(&format!("(?i)@{}", regex::escape(nickname))).ok()
}

#[cfg(any(test, target_arch = "wasm32"))]
pub fn chat_markdown(text: &str, mention: Option<&Regex>) -> String {
    let mut output = String::new();
    let append_text = |output: &mut String, text: &str| {
        let mut offset = 0;
        for matched in mention.iter().flat_map(|pattern| pattern.find_iter(text)) {
            escape_markdown(output, &text[offset..matched.start()]);
            output.push_str("**");
            escape_markdown(output, matched.as_str());
            output.push_str("**");
            offset = matched.end();
        }
        escape_markdown(output, &text[offset..]);
    };

    let mut offset = 0;
    for link in CHAT_LINK.find_iter(text) {
        append_text(&mut output, &text[offset..link.start()]);
        output.push('<');
        output.push_str(link.as_str());
        output.push('>');
        offset = link.end();
    }
    append_text(&mut output, &text[offset..]);
    output
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn links_only_supported_urls_and_treats_markup_as_plain_text() {
        assert_eq!(
            chat_markdown("https://youtu.be/a-b! [x](javascript:foo)", None),
            r"<https://youtu.be/a-b>\! \[x\]\(javascript\:foo\)"
        );
        assert_eq!(
            chat_markdown(
                "https://pixelbattles.ru.evil.test/ https://www.youtube.com/watch?v=abc_42",
                None
            ),
            r"https\:\/\/pixelbattles\.ru\.evil\.test\/ <https://www.youtube.com/watch?v=abc_42>"
        );
    }

    #[test]
    fn highlights_the_mention_with_a_literal_case_insensitive_nickname() {
        assert_eq!(
            chat_markdown(
                "Привет @Alice.1 и @AliceX1",
                chat_mentions("alice.1").as_ref()
            ),
            r"Привет **\@Alice\.1** и \@AliceX1"
        );
        assert_eq!(
            chat_markdown("Привет @РоМа", chat_mentions("рома").as_ref()),
            r"Привет **\@РоМа**"
        );
    }
}
