import {
  FormatDate,
  FormatDateToEndOfDay,
  FormatDateToStartOfDay,
  FormatDateWithShift,
} from './../../helper/formatDate';
import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { PrismaService } from 'src/prisma.service';
import uniqid from 'uniqid';
import { FilterPriceDto } from 'helper/dto/FilterPrice.dto';

@Injectable()
export class BookingsService {
  constructor(private prismaService: PrismaService) {}

  // ! Create Booking
  async create(createBookingDto: CreateBookingDto) {
    try {
      const {
        user_id,
        location_id,
        space_id,
        stage_id,
        decor_id,
        menu_id,
        name,
        amount,
        accessories,
        shift,
      } = createBookingDto;
      var { organization_date } = createBookingDto;
      organization_date = FormatDateWithShift(organization_date, shift);

      // ? Check Date And Shift is Exist
      const checkDateAndShift = await this.prismaService.bookings.findMany({
        where: {
          organization_date: {
            equals: organization_date,
          },
          shift,
        },
      });
      if (checkDateAndShift.length > 0) {
        throw new HttpException(
          'Đã có sự kiện tổ chức vào thời gian này',
          HttpStatus.BAD_REQUEST,
        );
      }
      // Fetching user, location, space, stage, decor, and menu in parallel
      const [user, location, space, stage, decor, menu] = await Promise.all([
        this.prismaService.users.findUnique({ where: { id: Number(user_id) } }),
        this.prismaService.locations.findUnique({
          where: { id: Number(location_id) },
        }),
        this.prismaService.spaces.findUnique({
          where: { id: Number(space_id) },
        }),
        this.prismaService.stages.findUnique({
          where: { id: Number(stage_id) },
        }),
        this.prismaService.decors.findUnique({
          where: { id: Number(decor_id) },
        }),
        this.prismaService.menus.findUnique({ where: { id: Number(menu_id) } }),
      ]);

      // Validate fetched data
      const validateExists = (entity: any, name: string) => {
        if (!entity)
          throw new HttpException(
            `Không tìm thấy ${name}`,
            HttpStatus.NOT_FOUND,
          );
      };
      validateExists(user, 'user');
      validateExists(location, 'location');
      validateExists(space, 'space');
      validateExists(stage, 'stage');
      validateExists(decor, 'decor');
      validateExists(menu, 'menu');

      // Calculate accessory amounts
      const {
        totalAmount: accessoriesTotal,
        totalTables,
        NewAccessories,
      } = await this.calculateAccessories(accessories);

      // Check Stage capacity
      if (totalTables > stage.capacity)
        throw new HttpException(
          'Số lượng bàn vượt quá sức chứa của sảnh',
          HttpStatus.BAD_REQUEST,
        );

      // Total calculation
      const totalAmount = decor.price + menu.price + accessoriesTotal;
      console.log('Total Amount:', totalAmount);
      console.log('FE Amount:', amount);
      if (Number(amount) !== totalAmount) {
        throw new HttpException(
          'Lỗi tính toán tổng tiền',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Calculate Fees
      const fee = 10 / 100; // 10%
      const totalFee = totalAmount * fee; // 10%
      const depositAmount = ((totalAmount + totalFee) * 0.3).toFixed(0); // 30%
      const bookingAmount = ((totalAmount + totalFee) * 0.7).toFixed(0); // 70%

      // Create Deposit
      const deposit = await this.prismaService.deposits.create({
        data: {
          transactionID: uniqid().toUpperCase(),
          name: `Tiền cọc tiệc của ${user.username}`,
          phone: user.phone,
          email: user.email,
          amount: Number(depositAmount),
        },
      });

      // Json Parse accessories
      const accessoriesFormat = {
        ...NewAccessories,
        total_price: accessoriesTotal,
      };

      // Create Booking
      const booking = await this.prismaService.bookings.create({
        data: {
          user_id: Number(user_id),
          location_id: Number(location_id),
          space_id: Number(space_id),
          stage_id: Number(stage_id),
          deposit_id: Number(deposit.id),
          decor_id: Number(decor_id),
          menu_id: Number(menu_id),
          name,
          amount: Number(bookingAmount),
          fee,
          total_amount: totalAmount + totalFee,
          accessories: accessoriesFormat,
          organization_date,
          shift,
        } as any,
      });

      // Fetch booking with relations
      const findBooking = await this.prismaService.bookings.findUnique({
        where: { id: booking.id },
        include: {
          users: {
            select: {
              id: true,
              username: true,
              email: true,
              phone: true,
              avatar: true,
              memberships_id: true,
              role: true,
            },
          },
          locations: {
            include: {
              location_detail: true,
            },
          },
          spaces: true,
          stages: true,
          decors: true,
          menus: true,
          deposits: true,
        },
      });

      throw new HttpException(
        { message: 'Đặt tiệc thành công', data: findBooking },
        HttpStatus.OK,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.log('Lỗi từ booking.service.ts -> create: ', error);
      throw new InternalServerErrorException(
        'Đã có lỗi xảy ra, vui lòng thử lại sau!',
      );
    }
  }

  // ! Find All Booking
  async findAll(query: FilterPriceDto) {
    try {
      const page = Number(query.page) || 1;
      const itemsPerPage = Number(query.itemsPerPage) || 10;
      const search = query.search || '';
      const skip = (page - 1) * itemsPerPage;
      const priceSort = query?.priceSort?.toLowerCase();
      const startDate = query.startDate
        ? FormatDateToStartOfDay(query.startDate)
        : null;
      const endDate = query.endDate
        ? FormatDateToEndOfDay(query.endDate)
        : null;

      const minPrice = Math.max(0, Number(query.minPrice) || 0);
      const maxPrice = Math.max(minPrice, Number(query.maxPrice) || 99999999);

      // ? Where Conditions
      const whereConditions: any = {
        deleted: false,
        OR: [
          {
            name: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            locations: {
              name: {
                contains: search,
                mode: 'insensitive',
              },
            },
          },
          {
            menus: {
              name: {
                contains: search,
                mode: 'insensitive',
              },
            },
          },
        ],
      };

      // ? Price Conditions
      if (minPrice >= 0) {
        if (!whereConditions.AND) whereConditions.AND = [];
        whereConditions.AND.push({ amount: { gte: minPrice, lte: maxPrice } });
      }

      // ? Date Conditions
      if (startDate && endDate) {
        if (!whereConditions.AND) whereConditions.AND = [];
        whereConditions.AND.push({
          created_at: { gte: startDate, lte: endDate },
        });
      }

      // ? Sort Conditions
      let orderByConditions: any = {};
      if (priceSort === 'asc' || priceSort === 'desc') {
        orderByConditions.price = priceSort;
      }

      // ? Fetch Data
      const [result, total] = await this.prismaService.$transaction([
        this.prismaService.bookings.findMany({
          where: whereConditions,
          include: {
            users: {
              select: {
                id: true,
                username: true,
                email: true,
                memberships_id: true,
                phone: true,
                avatar: true,
                role: true,
              },
            },
            locations: {
              include: {
                location_detail: true,
              },
            },
            spaces: true,
            stages: true,
            decors: true,
            menus: true,
            deposits: true,
          },
          orderBy: orderByConditions,
          skip,
          take: itemsPerPage,
        }),
        this.prismaService.bookings.count({
          where: whereConditions,
        }),
      ]);
      // ? Pagination
      const lastPage = Math.ceil(total / itemsPerPage);
      const paginationInfo = {
        nextPage: page + 1 > lastPage ? null : page + 1,
        prevPage: page - 1 <= 0 ? null : page - 1,
        lastPage: lastPage,
        itemsPerPage,
        currentPage: page,
        total,
      };

      // ? Response
      throw new HttpException(
        { data: result, pagination: paginationInfo },
        HttpStatus.OK,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.log('Lỗi từ booking.service.ts -> findAll: ', error);
      throw new InternalServerErrorException(
        'Đã có lỗi xảy ra, vui lòng thử lại sau!',
      );
    }
  }

  // ! Find All Deleted Booking
  async findAllDeleted(query: FilterPriceDto) {
    try {
      const page = Number(query.page) || 1;
      const itemsPerPage = Number(query.itemsPerPage) || 10;
      const search = query.search || '';
      const skip = (page - 1) * itemsPerPage;
      const priceSort = query?.priceSort?.toLowerCase();
      const startDate = query.startDate
        ? FormatDateToStartOfDay(query.startDate)
        : null;
      const endDate = query.endDate
        ? FormatDateToEndOfDay(query.endDate)
        : null;

      const minPrice = Math.max(0, Number(query.minPrice) || 0);
      const maxPrice = Math.max(minPrice, Number(query.maxPrice) || 99999999);

      // ? Where Conditions
      const whereConditions: any = {
        deleted: true,
        OR: [
          {
            name: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            locations: {
              name: {
                contains: search,
                mode: 'insensitive',
              },
            },
          },
          {
            menus: {
              name: {
                contains: search,
                mode: 'insensitive',
              },
            },
          },
        ],
      };

      // ? Price Conditions
      if (minPrice >= 0) {
        if (!whereConditions.AND) whereConditions.AND = [];
        whereConditions.AND.push({ amount: { gte: minPrice, lte: maxPrice } });
      }

      // ? Date Conditions
      if (startDate && endDate) {
        if (!whereConditions.AND) whereConditions.AND = [];
        whereConditions.AND.push({
          created_at: { gte: startDate, lte: endDate },
        });
      }

      // ? Sort Conditions
      let orderByConditions: any = {};
      if (priceSort === 'asc' || priceSort === 'desc') {
        orderByConditions.price = priceSort;
      }

      // ? Fetch Data
      const [result, total] = await this.prismaService.$transaction([
        this.prismaService.bookings.findMany({
          where: whereConditions,
          include: {
            users: {
              select: {
                id: true,
                username: true,
                email: true,
                memberships_id: true,
                phone: true,
                avatar: true,
                role: true,
              },
            },
            locations: {
              include: {
                location_detail: true,
              },
            },
            spaces: true,
            stages: true,
            decors: true,
            menus: true,
            deposits: true,
          },
          orderBy: orderByConditions,
          skip,
          take: itemsPerPage,
        }),
        this.prismaService.bookings.count({
          where: whereConditions,
        }),
      ]);
      // ? Pagination
      const lastPage = Math.ceil(total / itemsPerPage);
      const paginationInfo = {
        nextPage: page + 1 > lastPage ? null : page + 1,
        prevPage: page - 1 <= 0 ? null : page - 1,
        lastPage: lastPage,
        itemsPerPage,
        currentPage: page,
        total,
      };

      // ? Response
      throw new HttpException(
        { data: result, pagination: paginationInfo },
        HttpStatus.OK,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.log('Lỗi từ booking.service.ts -> findAllDeleted: ', error);
      throw new InternalServerErrorException(
        'Đã có lỗi xảy ra, vui lòng thử lại sau!',
      );
    }
  }

  // ! Find One Booking
  async findOne(id: number) {
    try {
      const findBooking = await this.prismaService.bookings.findUnique({
        where: { id: Number(id) },
        include: {
          users: {
            select: {
              id: true,
              username: true,
              email: true,
              memberships_id: true,
              phone: true,
              avatar: true,
              role: true,
            },
          },
          locations: true,
          spaces: true,
          stages: true,
          decors: true,
          menus: true,
          deposits: true,
        },
      });
      if (!findBooking) {
        throw new HttpException(
          'Không tìm thấy đơn đặt tiệc',
          HttpStatus.NOT_FOUND,
        );
      }

      throw new HttpException(findBooking, HttpStatus.OK);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.log('Lỗi từ booking.service.ts -> findOne: ', error);
      throw new InternalServerErrorException(
        'Đã có lỗi xảy ra, vui lòng thử lại sau!',
      );
    }
  }

  // ! Get Booking For Next 14 Days Timezone
  async getBookingForNext14Days() {
    try {
      const currentDate = new Date();
      const startDate = new Date(currentDate);
      const endDate = new Date(currentDate);
      startDate.setDate(currentDate.getDate() + 7);
      endDate.setDate(currentDate.getDate() + 21);
      console.log('Start Date:', startDate);
      console.log('End Date:', endDate);

      const bookings = await this.prismaService.bookings.findMany({
        where: {
          organization_date: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          id: true,
          name: true,
          organization_date: true,
          shift: true,
        },
      });

      const response = [];

      for (let i = 7; i <= 21; i++) {
        const dateToCheck = new Date(currentDate);
        dateToCheck.setDate(currentDate.getDate() + i);

        const shifts = ['Sáng', 'Tối'];
        for (const shift of shifts) {
          const existingBooking = bookings.find(
            (booking) =>
              new Date(booking.organization_date).toDateString() ===
                dateToCheck.toDateString() && booking.shift === shift,
          );
          const organi_date = dateToCheck.toISOString().split('T')[0];
          const [year, month, date] = organi_date.split('-');

          response.push({
            id: existingBooking ? existingBooking.id : null,
            name: existingBooking ? existingBooking.name : null,
            organization_date: `${date}-${month}-${year}`,
            shift: shift,
            status: !!existingBooking,
          });
        }
      }

      return {
        success: true,
        data: response,
        message: 'Lấy dữ liệu đặt chỗ thành công!',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      console.log(
        'Lỗi từ booking.service.ts -> getBookingForNext7Days: ',
        error,
      );
      throw new InternalServerErrorException(
        'Đã có lỗi xảy ra, vui lòng thử lại sau!',
      );
    }
  }

  // ! Calculate Accessories
  async update(id: number, updateBookingDto: UpdateBookingDto) {
    try {
      const {
        user_id,
        location_id,
        space_id,
        stage_id,
        decor_id,
        menu_id,
        name,
        amount,
        accessories,
        shift,
      } = updateBookingDto;
      var { organization_date } = updateBookingDto;
      organization_date = FormatDateWithShift(organization_date, shift);
      const findBooking = await this.prismaService.bookings.findUnique({
        where: { id: Number(id) },
      });

      // ? Kiểm tra ngày hiện tại phải cách ngày tổ chức ít nhất 7 ngày
      const currentDate = new Date();
      const startDate = new Date(currentDate);
      startDate.setDate(currentDate.getDate() + 7);
      if (new Date(organization_date) < startDate) {
        throw new HttpException(
          'Ngày tổ chức phải cách ngày hiện tại ít nhất 7 ngày',
          HttpStatus.BAD_REQUEST,
        );
      }
      // ? Nếu mà ngày tổ chức chỉ còn 3 ngày nữa là tổ chức thì sẽ không cho sửa
      const endDate = new Date(currentDate);
      endDate.setDate(currentDate.getDate() + 3);
      if (new Date(organization_date) < endDate) {
        throw new HttpException(
          'Không thể sửa thông tin đơn đặt tiệc khi còn 3 ngày nữa là tổ chức',
          HttpStatus.BAD_REQUEST,
        );
      }

      // ? Check Date And Shift is Exist
      const checkDateAndShift = await this.prismaService.bookings.findMany({
        where: {
          organization_date: {
            equals: organization_date,
          },
          shift,
        },
      });
      if (checkDateAndShift.length > 0) {
        throw new HttpException(
          'Đã có sự kiện tổ chức vào thời gian này',
          HttpStatus.BAD_REQUEST,
        );
      }
      // Fetching user, location, space, stage, decor, and menu in parallel
      const [user, location, space, stage, decor, menu] = await Promise.all([
        this.prismaService.users.findUnique({ where: { id: Number(user_id) } }),
        this.prismaService.locations.findUnique({
          where: { id: Number(location_id) },
        }),
        this.prismaService.spaces.findUnique({
          where: { id: Number(space_id) },
        }),
        this.prismaService.stages.findUnique({
          where: { id: Number(stage_id) },
        }),
        this.prismaService.decors.findUnique({
          where: { id: Number(decor_id) },
        }),
        this.prismaService.menus.findUnique({ where: { id: Number(menu_id) } }),
      ]);
      // Validate fetched data
      const validateExists = (entity: any, name: string) => {
        if (!entity)
          throw new HttpException(
            `Không tìm thấy ${name}`,
            HttpStatus.NOT_FOUND,
          );
      };
      validateExists(user, 'user');
      validateExists(location, 'location');
      validateExists(space, 'space');
      validateExists(stage, 'stage');
      validateExists(decor, 'decor');
      validateExists(menu, 'menu');
      // Calculate accessory amounts
      const {
        totalAmount: accessoriesTotal,
        totalTables,
        NewAccessories,
      } = await this.calculateAccessories(accessories);
      // Check Stage capacity
      if (totalTables > stage.capacity)
        throw new HttpException(
          'Số lượng bàn vượt quá sức chứa của sảnh',
          HttpStatus.BAD_REQUEST,
        );
      // Total calculation
      const totalAmount = decor.price + menu.price + accessoriesTotal;
      console.log('Total Amount:', totalAmount);
      console.log('FE Amount:', amount);
      if (Number(amount) !== totalAmount) {
        throw new HttpException(
          'Lỗi tính toán tổng tiền',
          HttpStatus.BAD_REQUEST,
        );
      }
      // Calculate Fees
      const fee = 10 / 100; // 10%
      const totalFee = totalAmount * fee; // 10%
      const depositAmount = ((totalAmount + totalFee) * 0.3).toFixed(0); // 30%
      const bookingAmount = ((totalAmount + totalFee) * 0.7).toFixed(0); // 70%
      // Create Deposit
      const deposit = await this.prismaService.deposits.create({
        data: {
          transactionID: uniqid().toUpperCase(),
          name: `Tiền cọc tiệc của ${user.username}`,
          phone: user.phone,
          email: user.email,
          amount: Number(depositAmount),
        },
      });
      // Json Parse accessories
      const accessoriesFormat = {
        ...NewAccessories,
        total_price: accessoriesTotal,
      };
      // Create Booking
      const booking = await this.prismaService.bookings.update({
        where: { id: Number(id) },
        data: {
          user_id: Number(user_id),
          location_id: Number(location_id),
          space_id: Number(space_id),
          stage_id: Number(stage_id),
          deposit_id: Number(deposit.id),
          decor_id: Number(decor_id),
          menu_id: Number(menu_id),
          name,
          amount: Number(bookingAmount),
          fee,
          total_amount: totalAmount + totalFee,
          accessories: accessoriesFormat,
          organization_date,
          shift,
        } as any,
      });
      throw new HttpException(
        { message: 'Đặt tiệc thành công', data: findBooking },
        HttpStatus.OK,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.log('Lỗi từ booking.service.ts -> update: ', error);
      throw new InternalServerErrorException(
        'Đã có lỗi xảy ra, vui lòng thử lại sau!',
      );
    }
  }

  async remove(id: number) {
    return `This action removes a #${id} booking`;
  }

  // ! Calculate accessory amounts
  private async calculateAccessories(accessories) {
    let accessoriesAmount = 0;
    let totalTables = 0;

    // Fetch table prices in parallel
    const tablePromises = accessories.table.map(async (table) => {
      const findTable = await this.prismaService.funitures.findUnique({
        where: { id: Number(table.id) },
      });
      if (!findTable)
        throw new HttpException(
          'Không tìm thấy loại bàn',
          HttpStatus.NOT_FOUND,
        );
      accessoriesAmount += findTable.price * table.quantity;
      totalTables += table.quantity;
      table.name = findTable.name;
      table.amount = findTable.price;
      table.total_price = findTable.price * table.quantity;
      table.description = findTable.description;
      table.short_description = findTable.short_description;
      table.images = findTable.images;
      table.type = findTable.type;
      return findTable.price * table.quantity;
    });

    await Promise.all(tablePromises);

    // Calculate chair price (1 table = 10 chairs)
    const findChair = await this.prismaService.funitures.findUnique({
      where: { id: Number(accessories.chair.id) },
    });
    accessories.chair.name = findChair.name;
    accessories.chair.amount = findChair.price;
    accessories.chair.description = findChair.description;
    accessories.chair.short_description = findChair.short_description;
    accessories.chair.images = findChair.images;
    accessories.chair.type = findChair.type;
    accessories.chair.quantity = totalTables * 10;
    accessories.chair.total_price = findChair.price * totalTables * 10;
    if (!findChair)
      throw new HttpException('Không tìm thấy loại ghế', HttpStatus.NOT_FOUND);

    const chairAmount = findChair.price * totalTables * 10; // 10 chairs per table
    console.log('Accessories:', accessories);
    return {
      totalAmount: accessoriesAmount + chairAmount,
      tableAmount: accessoriesAmount,
      totalTables,
      chairAmount,
      NewAccessories: accessories,
    };
  }
}
