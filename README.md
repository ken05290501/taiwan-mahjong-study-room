# Taiwan Mahjong Study Room

This repository contains a complete backup of the deployed Taiwan Mahjong Study Room v52.

## Restore the archive

Download every file under `backup/` and run:

```sh
cat backup/*.b64 | base64 -d > taiwan-mahjong-hall-v52-backup.zip
unzip taiwan-mahjong-hall-v52-backup.zip
```

The restored ZIP contains the complete website source code and assets.
