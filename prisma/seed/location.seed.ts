import { PrismaClient } from '@prisma/client';
import slugify from 'slugify';
const prisma = new PrismaClient();

const MakeSlugger = (str: string): string => {
  return slugify(str, {
    replacement: '',
    remove: undefined,
    lower: true,
    strict: false,
    locale: 'vi',
    trim: true,
  });
};

const locations = [
  {
    name: 'Hà Nội',
    address: 'Đường 1, Quận 1, Hà Nội',
    slug: MakeSlugger('Hà Nội'),
    phone: '111111111',
    email: 'chinhanh1@joieplace.com',
    images: [
      'https://res.cloudinary.com/dlpvcsewd/image/upload/v1726673256/joieplace/location/xhnquxrdecjxbbialilg.jpg,https://res.cloudinary.com/dlpvcsewd/image/upload/v1726673256/joieplace/location/pakoi5ihxkxbnqlnjgl1.jpg',
    ],
  },
  {
    name: 'Hồ Chí Minh',
    address: 'Đường 2, Quận 2, Hồ Chí Minh',
    slug: MakeSlugger('Hồ Chí Minh'),
    phone: '222222222',
    email: 'chinhanh2@joieplace.com',
    images: [
      'https://res.cloudinary.com/dlpvcsewd/image/upload/v1726673256/joieplace/location/xhnquxrdecjxbbialilg.jpg,https://res.cloudinary.com/dlpvcsewd/image/upload/v1726673256/joieplace/location/pakoi5ihxkxbnqlnjgl1.jpg',
    ],
  },
  {
    name: 'Đà Nẵng',
    address: 'Đường 3, Quận 3, Đà Nẵng',
    slug: MakeSlugger('Đà Nẵng'),
    phone: '333333333',
    email: 'chinhanh3@joieplace.com',
    images: [
      'https://res.cloudinary.com/dlpvcsewd/image/upload/v1726673256/joieplace/location/xhnquxrdecjxbbialilg.jpg,https://res.cloudinary.com/dlpvcsewd/image/upload/v1726673256/joieplace/location/pakoi5ihxkxbnqlnjgl1.jpg',
    ],
  },
  {
    name: 'Hải Phòng',
    address: 'Đường 4, Quận 4, Hải Phòng',
    slug: MakeSlugger('Hải Phòng'),
    phone: '444444444',
    email: 'chinhanh4@joieplace.com',
    images: [
      'https://res.cloudinary.com/dlpvcsewd/image/upload/v1726673256/joieplace/location/xhnquxrdecjxbbialilg.jpg,https://res.cloudinary.com/dlpvcsewd/image/upload/v1726673256/joieplace/location/pakoi5ihxkxbnqlnjgl1.jpg',
    ],
  },
  {
    name: 'Cần Thơ',
    address: 'Đường 5, Quận 5, Cần Thơ',
    slug: MakeSlugger('Cần Thơ'),
    phone: '555555555',
    email: 'chinhanh5@joieplace.com',
    images: [
      'https://res.cloudinary.com/dlpvcsewd/image/upload/v1726673256/joieplace/location/xhnquxrdecjxbbialilg.jpg,https://res.cloudinary.com/dlpvcsewd/image/upload/v1726673256/joieplace/location/pakoi5ihxkxbnqlnjgl1.jpg',
    ],
  },
  {
    name: 'Hà Tĩnh',
    address: 'Đường 6, Quận 6, Hà Tĩnh',
    slug: MakeSlugger('Hà Tĩnh'),
    phone: '666666666',
    email: 'chinhanh6@joieplace.com',
    images: [
      'https://res.cloudinary.com/dlpvcsewd/image/upload/v1726673256/joieplace/location/xhnquxrdecjxbbialilg.jpg,https://res.cloudinary.com/dlpvcsewd/image/upload/v1726673256/joieplace/location/pakoi5ihxkxbnqlnjgl1.jpg',
    ],
  },
  {
    name: 'Hà Nam',
    address: 'Đường 7, Quận 7, Hà Nam',
    slug: MakeSlugger('Hà Nam'),
    phone: '777777777',
    email: 'chinhanh6@joieplace.com',
    images: [
      'https://res.cloudinary.com/dlpvcsewd/image/upload/v1726673256/joieplace/location/xhnquxrdecjxbbialilg.jpg,https://res.cloudinary.com/dlpvcsewd/image/upload/v1726673256/joieplace/location/pakoi5ihxkxbnqlnjgl1.jpg',
    ],
  },
];
let locationIDS: number[] = [];
export const locationSeed = async () => {
  for (const location of locations) {
    console.log('Creating location:', location.name);
    const locations = await prisma.locations.create({
      data: {
        name: location.name,
        address: location.address,
        slug: location.slug,
        phone: location.phone,
        email: location.email,
        images: location.images,
      },
    });
    locationIDS.push(locations.id);
  }
  await seedLocationDetail();
};

const seedLocationDetail = async () => {
  for (const locationID of locationIDS) {
    await prisma.location_details.create({
      data: {
        location_id: Number(locationID),
        slogan_description: 'Slogan description',
        diagram_description: 'Diagram description',
        equipment_description: 'Equipment description',
        slogan: 'Slogan',
        diagram_images: [
          'https://res.cloudinary.com/dlpvcsewd/image/upload/v1726673256/joieplace/location/xhnquxrdecjxbbialilg.jpg,https://res.cloudinary.com/dlpvcsewd/image/upload/v1726673256/joieplace/location/pakoi5ihxkxbnqlnjgl1.jpg',
        ],
        slogan_images: [
          'https://res.cloudinary.com/dlpvcsewd/image/upload/v1726673256/joieplace/location/xhnquxrdecjxbbialilg.jpg,https://res.cloudinary.com/dlpvcsewd/image/upload/v1726673256/joieplace/location/pakoi5ihxkxbnqlnjgl1.jpg',
        ],
        equipment_images: [
          'https://res.cloudinary.com/dlpvcsewd/image/upload/v1726673256/joieplace/location/xhnquxrdecjxbbialilg.jpg,https://res.cloudinary.com/dlpvcsewd/image/upload/v1726673256/joieplace/location/pakoi5ihxkxbnqlnjgl1.jpg',
        ],
      },
    });
  }
};
