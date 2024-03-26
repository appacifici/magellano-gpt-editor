
interface IAlertService {
  initProcess(sCode: string): string;
  write(process: string, processName: string): Promise<boolean>;
  setLimitWrite(limit: number): void;
  getAlert(code: string): any[];
  setAlert(code: string, alert: any): void;
  getDebug(code: string): any[];
  setDebug(code: string, debug: any, label?: string | null): void;
  getError(code: string): any[];
  setError(code: string, error: any): void;
  getGeneral(code: string): any[];
  setGeneral(code: string, general: any): void;
  getCallData(code: string): any[];
  setCallData(code: string, callData: any): void;
  getCallResponse(code: string): any[];
  setCallResponse(code: string, callResponse: any): void;
}


export { IAlertService };
