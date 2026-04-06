const WORDS = [
  "gentle", "river", "morning", "sky", "meadow", "quiet", "bloom", "drift",
  "cloud", "ember", "fern", "harbor", "light", "mist", "pebble", "rain",
  "shore", "willow", "breeze", "dawn", "amber", "brook", "coral", "dew",
  "echo", "feather", "glow", "haven", "iris", "jade", "kelp", "linen",
  "maple", "nest", "opal", "pearl", "quill", "reed", "sage", "terra",
  "umber", "vale", "wren", "yarn", "zenith", "acorn", "birch", "cedar",
  "dahlia", "elm", "flint", "grove", "honey", "ivy", "jasmine", "kite",
  "lark", "moss", "nutmeg", "olive", "pine", "quartz", "rose", "stone",
  "tulip", "violet", "wheat", "yarrow", "zinnia", "aspen", "basil", "clover",
  "dune", "evergreen", "frost", "garden", "haze", "inlet", "juniper", "lake",
  "lunar", "marigold", "nectar", "orchid", "plum", "ripple", "saffron", "thyme",
  "laurel", "velvet", "walnut", "crystal", "sunset", "candle", "cove", "daisy",
  "silk", "lemon", "cinnamon", "lavender", "peach", "copper", "starling", "tide",
  "seashell", "sparrow", "sunbeam", "clementine", "poppy", "sable", "cream",
  "robin", "hazel", "twig", "petal", "marsh", "cobalt", "dusk", "field",
  "golden", "hollow", "lantern", "marble", "ocean", "prairie", "shelter", "trail",
  "warmth", "adobe", "bamboo", "chamomile", "dewdrop", "finch", "garnet", "heron",
  "island", "journey", "kindling", "lotus", "mineral", "north", "oriole", "pasture",
  "serene", "timber", "wander", "blush", "calm", "dreamy", "earthy", "flora",
  "gleam", "humble", "indigo", "joyful", "kind", "lullaby", "mellow", "nimble",
  "oasis", "peaceful", "radiant", "still", "tender", "unity", "vivid", "whimsy",
  "breeze", "charm", "delicate", "evening", "fireside", "gentle", "healing", "imagine",
  "jewel", "kayak", "lilac", "moonshadow", "nature", "ocean", "pillow", "restful",
  "snowfall", "tranquil", "unwind", "verdant", "waterfall", "blossom", "coastline", "daybreak",
  "ember", "fountain", "grateful", "horizon", "inspire", "juniper", "kinship", "lighthouse",
];

export function generatePassphrase(): string {
  const selected: string[] = [];
  const used = new Set<number>();
  while (selected.length < 4) {
    const idx = Math.floor(Math.random() * WORDS.length);
    if (!used.has(idx)) {
      used.add(idx);
      selected.push(WORDS[idx]);
    }
  }
  return selected.join("-");
}
