import { Response } from 'express';
import { AuthRequest } from '../types';
export declare const createWedding: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getWeddings: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getWedding: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateWedding: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getWeddingStats: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteWedding: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=wedding.controller.d.ts.map