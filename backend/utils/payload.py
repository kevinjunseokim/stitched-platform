def str_field(data, key, *, lower=False):
    value = str(data.get(key) or "").strip()
    return value.lower() if lower else value
