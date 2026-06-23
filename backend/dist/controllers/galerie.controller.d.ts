import { Request, Response } from 'express';
import { AuthRequest } from '../types';
export declare const getGaleriePage: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const uploadPhoto: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const modererPhoto: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deletePhoto: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getGalerieData: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=galerie.controller.d.ts.map