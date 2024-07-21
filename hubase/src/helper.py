def short(string: str) -> str:
    if len(string) > 25:
        return string[:22] + "..."
    return string
