import { Request, Response } from 'express';
import { AuthRequest } from '../types';
export declare const getRsvpPage: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const submitRsvp: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getInvites: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const addInviteManuel: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateInvite: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteInvite: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getRsvpStats: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getRsvpInfo: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=rsvp.controller.d.ts.map