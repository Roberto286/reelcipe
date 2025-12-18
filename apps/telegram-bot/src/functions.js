export function isUrl(text) {
    const urlRegex =
        /^(https?:\/\/)?([\w\-]+(\.[\w\-]+)+)(:\d+)?(\/[^\s?]*)?(\?[^\s#]*)?(#[^\s]*)?$/i;

    return urlRegex.test(text);
}
