import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { isPublic } from 'decorator/auth.decorator';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { FilterPriceDto } from 'helper/dto/FilterPrice.dto';

@ApiTags('bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  // ! Create Booking
  @isPublic()
  @Post('create')
  create(@Body() createBookingDto: CreateBookingDto) {
    return this.bookingsService.create(createBookingDto);
  }

  // ! Get All Booking
  @Get('get-all')
  @ApiOperation({ summary: 'Lấy danh sách món ăn' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'itemsPerPage', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'minPrice', required: false })
  @ApiQuery({ name: 'maxPrice', required: false })
  @ApiQuery({ name: 'priceSort', required: false, description: 'ASC | DESC' })
  @ApiQuery({ name: 'startDate', required: false, description: '28-10-2004' })
  @ApiQuery({ name: 'endDate', required: false, description: '28-10-2024' })
  findAll(@Query() query: FilterPriceDto) {
    return this.bookingsService.findAll(query);
  }

  // ! Get All Deleted Booking
  @Get('get-all-deleted')
  @ApiOperation({ summary: 'Lấy danh sách món ăn' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'itemsPerPage', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'minPrice', required: false })
  @ApiQuery({ name: 'maxPrice', required: false })
  @ApiQuery({ name: 'priceSort', required: false, description: 'ASC | DESC' })
  @ApiQuery({ name: 'startDate', required: false, description: '28-10-2004' })
  @ApiQuery({ name: 'endDate', required: false, description: '28-10-2024' })
  findAllDeleted(@Query() query: FilterPriceDto) {
    return this.bookingsService.findAllDeleted(query);
  }

  // ! Get One Booking
  @Get('get/:booking_id')
  findOne(@Param('booking_id') id: number) {
    return this.bookingsService.findOne(id);
  }

  // ! Get Booking For Next 14 Days
  @isPublic()
  @Get('get-booking-list')
  getNext7Days() {
    return this.bookingsService.getBookingForNext14Days();
  }

  // ! Update Booking
  @Patch('update/:booking_id')
  update(
    @Param('update/booking_id') id: number,
    @Body() updateBookingDto: UpdateBookingDto,
  ) {
    return this.bookingsService.update(id, updateBookingDto);
  }

  @Delete(':booking_id')
  remove(@Param('booking_id') id: number) {
    return this.bookingsService.remove(id);
  }
}
