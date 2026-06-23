import { Response } from 'express';
import { AuthRequest } from '../types';
export declare const getRappels: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createRappel: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const retryRappel: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=rappel.controller.d.ts.map