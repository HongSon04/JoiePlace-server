import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty } from 'class-validator';

export class CreateBookingDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'User ID không được để trống' })
  user_id: number;

  @ApiProperty()
  @IsNotEmpty({ message: 'Địa chỉ không được để trống' })
  location_id: number;

  @ApiProperty()
  @IsNotEmpty({ message: 'Không gian không được để trống' })
  space_id: number;

  @ApiProperty()
  @IsNotEmpty({ message: 'Sảnh không được để trống' })
  stage_id: number;

  @ApiProperty()
  @IsNotEmpty({ message: 'Trang trí không được để trống' })
  decor_id: number;

  @ApiProperty()
  @IsNotEmpty({ message: 'Vui lòng chọn menu' })
  menu_id: number;

  @ApiProperty()
  @IsNotEmpty({ message: 'Tên sự kiện không được để trống' })
  name: string;

  @ApiProperty({
    example: {
      table: [
        { id: 1, quantity: 2 },
        { id: 2, quantity: 1 },
      ],
      chair: {
        id: 3,
      },
    },
  })
  accessories: {
    table: [{ id: number; quantity: number; amount?: number }]; // ID của bàn và số lượng
    chair: { id: number; amount?: number }; // ID của ghế
    total_price?: number; // Total price of accessories
  };

  @IsNotEmpty({ message: 'Vui lòng chọn loại bàn ghế' })
  @ApiProperty()
  @IsNotEmpty({ message: 'Vui lòng chọn ca' })
  @IsEnum(['Sáng', 'Tối'], {
    message: 'Ca tổ chức không hợp lệ (Sáng, Tối)',
  })
  shift: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'Vui lòng chọn ngày tổ chức sự kiện' })
  organization_date: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'Tổng tiền không được để trống' })
  amount: number;
}
