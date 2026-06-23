import { Response } from 'express';
import { AuthRequest } from '../types';
export declare const createBudgetItem: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getBudget: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateBudgetItem: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteBudgetItem: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=budget.controller.d.ts.map