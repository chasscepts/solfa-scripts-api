export const CATEGORY_OPTIONS = {
  liturgicalFunction: [
    "The Ordinary",
    "The Proper: Entrance / Processional Chant",
    "The Proper: Responsorial Psalm",
    "The Proper: Gospel Acclamation",
    "The Proper: Offertory / Presentation of Gifts",
    "The Proper: Communion Song",
    "Special Ritual: Baptism / Funeral / Wedding",
    "Special Ritual: Sequence",
    "Non-Liturgical: Gathering / Prelude",
    "Non-Liturgical: Recessional / Sending Forth",
    "Non-Liturgical: Praise & Worship Rally"
  ],
  liturgicalSeason: [
    "Ordinary Time",
    "Advent",
    "Christmas",
    "Lent",
    "Triduum / Holy Week",
    "Eastertide",
    "Feast Days / Solemnities (General)"
  ],
  musicalStyle: [
    "Gregorian Chant (Monophonic/Latin)",
    "Sacred Polyphony (Choral/Unaccompanied)",
    "Traditional Hymnody (Metric/Organ/4-Part)",
    "Contemporary Liturgical / Folk-Mass (Acoustic/Guitar)",
    "Charismatic / Catholic Praise & Worship (Modern)"
  ],
  devotionalFocus: [
    "Eucharistic / Adoration",
    "Marian (Blessed Virgin Mary)",
    "Trinitarian / Christological",
    "Scriptural Paraphrase (Psalms / Prophecy)",
    "Social Justice / Community / Unity",
    "Saints & Martyrs"
  ]
};

export const SONG_RESOURCE_TYPES = {
  audio: 'Audio',
  image: 'Image',
  link: 'Link',
  pdf: 'PDF',
  video: 'Video',
  youtube: 'YouTube',
};

export const SONG_RESOURCE_TYPES_LIST = Object.values(SONG_RESOURCE_TYPES);
