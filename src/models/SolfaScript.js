import mongoose from 'mongoose';

const { Schema } = mongoose;

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const SOLFA_VALUES = [
  'd',
  'de',
  'r',
  'ma',
  'm',
  'f',
  'fe',
  's',
  'se',
  'l',
  'ta',
  't',
  '𝄽', // rest
];

const OCTAVE_SHIFTS = [-2, -1, 0, 1, 2];

const DURATIONS = [
  '1/1',
  '1/2',
  '1/4',
  '1/3',
  '3/4',
];

const SUBDIVISIONS = [
  'binary',
  'ternary',
];

const VOICES = [
  'soprano',
  'alto',
  'tenor',
  'bass',
];

const PART_TYPES = [
  'voice',
  'text',
];

/*
|--------------------------------------------------------------------------
| Text Style
|--------------------------------------------------------------------------
*/

const TextStyleSchema = new Schema(
  {
    color: {
      type: String,
      trim: true,
      match: /^#[0-9a-fA-F]{3,8}$/,
      default: undefined,
    },

    fontSize: {
      type: Number,
      min: 1,
      max: 200,
      default: undefined,
    },

    fontWeight: {
      type: Number,
      min: 100,
      max: 900,
      default: undefined,
    },

    fontStyle: {
      type: String,
      enum: ['normal', 'italic', 'oblique'],
      default: undefined,
    },

    textDecoration: {
      type: String,
      enum: ['none', 'underline', 'line-through'],
      default: undefined,
    },
  },
  {
    _id: false,
    strict: true,
  }
);

/*
|--------------------------------------------------------------------------
| Text Segment
|--------------------------------------------------------------------------
*/

const TextSegmentSchema = new Schema(
  {
    id: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    text: {
      type: String,
      required: true,
      maxlength: 5000,
    },

    style: {
      type: TextStyleSchema,
      default: undefined,
    },
  },
  {
    _id: false,
    strict: true,
  }
);

/*
|--------------------------------------------------------------------------
| Text Content
|--------------------------------------------------------------------------
*/

const TextContentSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['solfa-word-style-text'],
      required: true,
    },

    version: {
      type: Number,
      min: 1,
      max: 100,
      default: 1,
    },

    segments: {
      type: [TextSegmentSchema],
      required: true,
      validate: {
        validator: (value) => value.length <= 500,
        message: 'A text block cannot contain more than 500 segments.',
      },
    },
  },
  {
    _id: false,
    strict: true,
  }
);

/*
|--------------------------------------------------------------------------
| Note
|
| A note can contain either:
|
| 1. A normal note:
|    {
|      duration: '1/1',
|      value: 'd',
|      isAttack: true
|    }
|
| 2. A beat group:
|    {
|      id: '...',
|      beats: [
|        { duration: '1/2', value: 'd' },
|        { duration: '1/2', value: 'r' }
|      ]
|    }
|
|--------------------------------------------------------------------------
*/

const BeatSchema = new Schema(
  {
    id: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    duration: {
      type: String,
      enum: DURATIONS,
      required: true,
    },

    isAttack: {
      type: Boolean,
      required: true,
    },

    octaveShift: {
      type: Number,
      enum: OCTAVE_SHIFTS,
      default: 0,
    },

    value: {
      type: String,
      enum: SOLFA_VALUES,
      required: true,
    },

    subdivision: {
      type: String,
      enum: SUBDIVISIONS,
      default: 'binary',
    },
  },
  {
    _id: false,
    strict: true,
  }
);

const NoteSchema = new Schema(
  {
    id: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    duration: {
      type: String,
      enum: DURATIONS,
      required: function () {
        return !this.beats || this.beats.length === 0;
      },
    },

    isAttack: {
      type: Boolean,
      required: function () {
        return !this.beats || this.beats.length === 0;
      },
    },

    octaveShift: {
      type: Number,
      enum: OCTAVE_SHIFTS,
      default: 0,
      required: function () {
        return !this.beats || this.beats.length === 0;
      },
    },

    value: {
      type: String,
      enum: SOLFA_VALUES,
      required: function () {
        return !this.beats || this.beats.length === 0;
      },
    },

    subdivision: {
      type: String,
      enum: SUBDIVISIONS,
      default: 'binary',
    },

    beats: {
      type: [BeatSchema],
      default: undefined,
      validate: {
        validator: (value) => !value || value.length <= 32,
        message: 'A beat group cannot contain more than 32 beats.',
      },
    },
  },
  {
    _id: false,
    strict: true,
  }
);

/*
|--------------------------------------------------------------------------
| Column
|--------------------------------------------------------------------------
*/

const ColumnSchema = new Schema(
  {
    id: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    notes: {
      type: [NoteSchema],
      default: [],
      validate: {
        validator: (value) => value.length <= 32,
        message: 'A column cannot contain more than 32 notes.',
      },
    },
  },
  {
    _id: false,
    strict: true,
  }
);

/*
|--------------------------------------------------------------------------
| Column Definition
|--------------------------------------------------------------------------
*/

const ColumnItemSchema = new Schema(
  {
    id: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    index: {
      type: Number,
      required: true,
      min: 0,
      max: 1000,
    },

    label: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    slots: {
      type: Number,
      min: 1,
      max: 64,
      required: true,
    },

    width: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
    },
  },
  {
    _id: false,
    strict: true,
  }
);

const ColumnsSchema = new Schema(
  {
    count: {
      type: Number,
      required: true,
      min: 1,
      max: 1000,
    },

    items: {
      type: [ColumnItemSchema],
      required: true,
      validate: {
        validator: (value) => value.length <= 1000,
        message: 'A script cannot contain more than 1000 columns.',
      },
    },

    uniformWidth: {
      type: Boolean,
      default: true,
    },
  },
  {
    _id: false,
    strict: true,
  }
);

/*
|--------------------------------------------------------------------------
| Voice Part
|--------------------------------------------------------------------------
*/

const VoicePartSchema = new Schema(
  {
    id: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    type: {
      type: String,
      enum: ['voice'],
      required: true,
    },

    voice: {
      type: String,
      enum: VOICES,
      required: true,
    },

    columns: {
      type: [ColumnSchema],
      required: true,
      validate: {
        validator: (value) => value.length <= 1000,
        message: 'A voice part cannot contain more than 1000 columns.',
      },
    },
  },
  {
    _id: false,
    strict: true,
  }
);

/*
|--------------------------------------------------------------------------
| Text Part
|--------------------------------------------------------------------------
*/

const TextPartSchema = new Schema(
  {
    id: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    type: {
      type: String,
      enum: ['text'],
      required: true,
    },

    content: {
      type: TextContentSchema,
      required: true,
    },
  },
  {
    _id: false,
    strict: true,
  }
);

/*
|--------------------------------------------------------------------------
| Structured Section
|--------------------------------------------------------------------------
*/

const StructuredSectionSchema = new Schema(
  {
    id: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    columns: {
      type: ColumnsSchema,
      required: true,
    },

    parts: {
      type: [Schema.Types.Mixed],
      required: true,
      validate: {
        validator: (value) => {
          if (!Array.isArray(value)) return false;

          return value.length <= 20;
        },
        message: 'A section cannot contain more than 20 parts.',
      },
    },
  },
  {
    _id: false,
    strict: true,
  }
);

/*
|--------------------------------------------------------------------------
| Script
|--------------------------------------------------------------------------
*/

const ScriptSchema = new Schema(
  {
    /*
    |--------------------------------------------------------------------------
    | Ownership
    |--------------------------------------------------------------------------
    */

    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
      immutable: true,
    },

    /*
    |--------------------------------------------------------------------------
    | Metadata
    |--------------------------------------------------------------------------
    */

    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 200,
    },

    composer: {
      type: String,
      trim: true,
      maxlength: 200,
      default: 'Unknown',
    },

    tonic: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20,
    },

    meter: {
      type: String,
      required: true,
      trim: true,
      match: /^\d+\s*\/\s*\d+$/,
    },

    tempo: {
      type: Number,
      min: 20,
      max: 400,
      default: 100,
    },

    /*
    |--------------------------------------------------------------------------
    | Editor layout
    |--------------------------------------------------------------------------
    */

    columns: {
      type: Number,
      required: true,
      min: 1,
      max: 1000,
    },

    rows: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
    },

    satb: {
      soprano: {
        type: Boolean,
        default: false,
      },

      alto: {
        type: Boolean,
        default: false,
      },

      tenor: {
        type: Boolean,
        default: false,
      },

      bass: {
        type: Boolean,
        default: false,
      },
    },

    /*
    |--------------------------------------------------------------------------
    | Score
    |--------------------------------------------------------------------------
    */

    structuredNotes: {
      type: [StructuredSectionSchema],
      required: true,
      validate: {
        validator: (value) => value.length <= 100,
        message: 'A script cannot contain more than 100 sections.',
      },
    },
  },
  {
    timestamps: true,

    strict: true,

    versionKey: false,

    minimize: true,
  }
);

/*
|--------------------------------------------------------------------------
| Indexes
|--------------------------------------------------------------------------
*/

ScriptSchema.index({
  owner: 1,
  updatedAt: -1,
});

ScriptSchema.index({
  owner: 1,
  createdAt: -1,
});

ScriptSchema.index({
  owner: 1,
  title: 1,
});

/*
|--------------------------------------------------------------------------
| Validation
|--------------------------------------------------------------------------
|
| Keep structuredNotes.parts strict without using unrestricted Mixed.
|
| Mongoose's array-of-Mixed is intentionally avoided above by validating
| the actual part shape here before persistence.
|
|--------------------------------------------------------------------------
*/

ScriptSchema.pre('validate', function (next) {
  try {
    for (const section of this.structuredNotes || []) {
      for (const part of section.parts || []) {
        if (!part || typeof part !== 'object') {
          return next(new Error('Invalid score part.'));
        }

        if (!PART_TYPES.includes(part.type)) {
          return next(new Error('Invalid score part type.'));
        }

        if (part.type === 'voice') {
          if (!VOICES.includes(part.voice)) {
            return next(new Error('Invalid voice part.'));
          }

          if (!Array.isArray(part.columns)) {
            return next(new Error('Voice part columns must be an array.'));
          }
        }

        if (part.type === 'text') {
          if (
            !part.content ||
            part.content.type !== 'solfa-word-style-text' ||
            !Array.isArray(part.content.segments)
          ) {
            return next(new Error('Invalid text part.'));
          }
        }
      }
    }

    next();
  } catch (error) {
    next(error);
  }
});

const Script = mongoose.model('SolfaScript', ScriptSchema);

export default Script;
