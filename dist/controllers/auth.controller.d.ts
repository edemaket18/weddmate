import { Request, Response } from 'express';
import { AuthRequest } from '../types';
import { RegisterInput, LoginInput } from '../schemas/auth.schema';
export declare const register: (req: Request<{}, {}, RegisterInput>, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const login: (req: Request<{}, {}, LoginInput>, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const me: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateProfile: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const changePassword: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const logout: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=auth.controller.d.ts.map