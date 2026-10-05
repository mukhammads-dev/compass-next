import { MyRoomStatus } from '../../enums/my-room.enum';
import { ProductRoom, ProductStyle } from '../../enums/product.enum';

/** All sizes in cm, budget in KRW. */
export interface MyRoom {
	_id: string;
	myRoomStatus: MyRoomStatus;
	myRoomName: string;
	myRoomType: ProductRoom;
	myRoomWidth: number;
	myRoomDepth: number;
	myRoomHeight?: number;
	myRoomDoorWidth?: number;
	myRoomDoorHeight?: number;
	myRoomStyle?: ProductStyle;
	myRoomBudget?: number;
	myRoomImage?: string;
	memberId: string;
	createdAt: Date;
}

export interface ProductFit {
	productId: string;
	myRoomId: string;
	fitsRoom: boolean;
	fitsDoor?: boolean;
	warnings: string[];
}

export interface MyRoomInput {
	myRoomName: string;
	myRoomType: ProductRoom;
	myRoomWidth: number;
	myRoomDepth: number;
	myRoomHeight?: number;
	myRoomDoorWidth?: number;
	myRoomDoorHeight?: number;
	myRoomStyle?: ProductStyle;
	myRoomBudget?: number;
}

export interface MyRoomUpdate extends Partial<MyRoomInput> {
	_id: string;
	myRoomStatus?: MyRoomStatus;
}
