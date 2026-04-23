import mongoose from 'mongoose';

const restaurantSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    name: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: false,
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        required: false,
        default: [0, 0] // [longitude, latitude]
      }
    },
    rating: {
      type: Number,
      required: true,
      default: 0,
    },
    numReviews: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

restaurantSchema.index({ location: '2dsphere' });

const Restaurant = mongoose.model('Restaurant', restaurantSchema);

export default Restaurant;
