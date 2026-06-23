import { Response } from 'express';
import { AuthRequest } from '../types';
export declare const getTaches: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createTache: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateTache: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const toggleTache: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteTache: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const clearTaches: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=tache.controller.d.ts.map