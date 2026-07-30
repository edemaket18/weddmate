import { Response } from 'express';
import { AuthRequest } from '../types';
export declare const addPrestataire: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getPrestataires: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getPrestataire: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updatePrestataire: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const removePrestataire: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const evaluerPrestataire: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=prestataire.controller.d.ts.map