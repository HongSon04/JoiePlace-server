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

const foods = [
  {
    name: 'Bún riêu',
    slug: MakeSlugger('Bún riêu'),
    description: 'Món ăn ngon',
    short_description: 'Món ăn ngon',
    price: 20000,
    images: [
      'https://res.cloudinary.com/dlpvcsewd/image/upload/v1725472645/joieplace/foods/y0c7tfqz3sxjocxuxtee.jpg,https://res.cloudinary.com/dlpvcsewd/image/upload/v1725472646/joieplace/foods/cbe7ecs5kzugthltxdb1.jpg',
    ],
  },
  {
    name: 'Bún chả',
    slug: MakeSlugger('Bún chả'),
    description: 'Món ăn ngon',
    short_description: 'Món ăn ngon',
    price: 30000,
    images: [
      'https://res.cloudinary.com/dlpvcsewd/image/upload/v1725472645/joieplace/foods/y0c7tfqz3sxjocxuxtee.jpg,https://res.cloudinary.com/dlpvcsewd/image/upload/v1725472646/joieplace/foods/cbe7ecs5kzugthltxdb1.jpg',
    ],
  },
  {
    name: 'Bún đậu',
    slug: MakeSlugger('Bún đậu'),
    description: 'Món ăn ngon',
    short_description: 'Món ăn ngon',
    price: 40000,
    images: [
      'https://res.cloudinary.com/dlpvcsewd/image/upload/v1725472645/joieplace/foods/y0c7tfqz3sxjocxuxtee.jpg,https://res.cloudinary.com/dlpvcsewd/image/upload/v1725472646/joieplace/foods/cbe7ecs5kzugthltxdb1.jpg',
    ],
  },
  {
    name: 'Bún bò',
    slug: MakeSlugger('Bún bò'),
    description: 'Món ăn ngon',
    short_description: 'Món ăn ngon',
    price: 50000,
    images: [
      'https://res.cloudinary.com/dlpvcsewd/image/upload/v1725472645/joieplace/foods/y0c7tfqz3sxjocxuxtee.jpg,https://res.cloudinary.com/dlpvcsewd/image/upload/v1725472646/joieplace/foods/cbe7ecs5kzugthltxdb1.jpg',
    ],
  },
  {
    name: 'Bún mắm',
    slug: MakeSlugger('Bún mắm'),
    description: 'Món ăn ngon',
    short_description: 'Món ăn ngon',
    price: 60000,
    images: [
      'https://res.cloudinary.com/dlpvcsewd/image/upload/v1725472645/joieplace/foods/y0c7tfqz3sxjocxuxtee.jpg,https://res.cloudinary.com/dlpvcsewd/image/upload/v1725472646/joieplace/foods/cbe7ecs5kzugthltxdb1.jpg',
    ],
  },
];

export const foodSeed = async () => {
  const categoriesIDs = [];
  const categories = await prisma.categories.findMany();
  for (const category of categories) {
    categoriesIDs.push(category.id);
  }
  for (const food of foods) {
    await prisma.foods.create({
      data: {
        name: food.name,
        slug: food.slug,
        category_id: Number(
          categoriesIDs[Math.floor(Math.random() * categoriesIDs.length)],
        ),
        description: food.description,
        short_description: food.short_description,
        price: food.price,
        images: food.images,
      },
    });
  }
};
