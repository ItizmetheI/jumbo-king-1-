# Photography

Client-supplied AI-generated food images, replacing the earlier Unsplash
placeholders. Not photographs of food served in the restaurant — the shoot in
`SHOT-LIST.md` still stands as the eventual replacement.

Each is encoded as AVIF, WebP and JPEG; the browser picks the smallest it
supports.

| File | Slot | Ratio | Source |
|---|---|---|---|
| hero | home hero | 4:3 | bacon double cheeseburger |
| beef | showcase panel | 4:5 | double, everything on |
| chicken | showcase panel | 4:5 | crispy chicken |
| breakfast | showcase panel | 4:5 | croissant sausage, egg & cheese |
| sides | showcase panel | 4:5 | french fries |
| sweets | showcase panel | 4:5 | ice cream shake, branded cup |
| og-image | social share card | 1200x630 | bacon double cheeseburger |
| jumbo-king-burger, jumbo-king-double, jumbo-loaded-king, jumbo-king-jr | signature squares | 1:1 | |
| grilled-chicken, crispy-chicken, spicy-chicken, chicken-wrap, fish-sandwich | signature squares | 1:1 | |

All nine signature squares now carry photos, so the illustrated fallbacks no
longer render. The artwork stays in `data.js` and returns automatically if any
`PHOTOS` value is blanked.

## Provenance and quality

Most were supplied as phone screenshots of a chat app. They were cropped
programmatically: the photo region is detected by colour, then the status bar,
prompt bubble, keyboard and the overlay buttons are removed. One board image was
cropped to drop a third-party brand mark.

That limits resolution — most sources are roughly 400px on the long edge, so the
larger slots are upscaled and will look soft on big screens. `chicken` and
`crispy-chicken` came from a full-size file and are sharp. `breakfast`, `sides`
and `sweets` are cropped from the printed menu boards.

If higher-resolution originals turn up, drop them in at the same filenames and
ratios; nothing else needs to change.
