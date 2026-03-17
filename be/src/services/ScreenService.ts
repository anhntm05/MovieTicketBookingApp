import { Cinema } from '../models/Cinema';
import { Screen } from '../models/Screen';
import { Seat } from '../models/Seat';
import { ICinema, IScreen, IScreenRequest, ISeat, ISeatRequest } from '../types';
import { ERROR_MESSAGES } from '../utils/constants';

export class ScreenService {
  static async createScreen(cinemaId: string, screenData: IScreenRequest): Promise<IScreen> {
    const cinema = await Cinema.findById(cinemaId);
    if (!cinema) {
      const error: any = new Error(ERROR_MESSAGES.CINEMA_NOT_FOUND);
      error.statusCode = 404;
      throw error;
    }

    const screen = new Screen({
      ...screenData,
      cinema: cinemaId,
    });

    await screen.save();
    return screen;
  }

  static async getSeatsForScreen(screenId: string): Promise<ISeat[]> {
    const screen = await Screen.findById(screenId);
    if (!screen) {
      const error: any = new Error('Screen not found');
      error.statusCode = 404;
      throw error;
    }

    return Seat.find({ screen: screenId }).sort({ row: 1, number: 1 });
  }

  static async createSeats(screenId: string, seats: ISeatRequest[]): Promise<ISeat[]> {
    const screen = await Screen.findById(screenId);
    if (!screen) {
      const error: any = new Error('Screen not found');
      error.statusCode = 404;
      throw error;
    }

    const createdSeats = await Seat.insertMany(
      seats.map((seat) => ({
        ...seat,
        screen: screenId,
        status: seat.status || 'active',
      }))
    );

    return createdSeats;
  }
}

export default ScreenService;
