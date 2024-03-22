import mongoose             from 'mongoose';
import connectMongoDB       from '../../database/mongodb/connect';
import Alert, { IAlert }    from '../../database/mongodb/models/Alert';
import { IAlertService }    from './Interface/IAlertService';

class AlertUtility implements IAlertService{
    private processes:  any = {};
    private limitWrite: number;    

    constructor() {
        this.limitWrite = 6000;
        this.processes  = {};
    }

    public initProcess(sCode: string): string {
        const code:string = this.md5(sCode);
        this.processes[code] = {
            child:          null,
            alert:          [],
            debug:          [],
            error:          [],
            general:        [],
            callData:       [],
            callResponse:   [],
        };
        return code;
    }

    public async write(process: string, processName: string): Promise<boolean> {
        if (!mongoose.connection.readyState) {
            await connectMongoDB();
        }

        const session = await mongoose.startSession();
        session.startTransaction();

        try {            
            let totalDuration = 0;         

            if (this.processes[process].error.length === 0 && totalDuration < this.limitWrite) {
                await session.commitTransaction();
                return true;
            }

            if (totalDuration > this.limitWrite) {
                this.setAlert(process, `Superato il limite di tempo di ${this.limitWrite} ms, tempo totale esecuzione script: ${totalDuration} ms`);
            }

            // Implement event saving logic here using your TimeTracker model

            // Save alert
            const alert: IAlert = new Alert({
                processName,
                process,
                debug:          this.setFormatArrayText(this.processes[process].debug),
                alert:          this.setFormatArrayText(this.processes[process].alert),
                error:          this.setFormatArrayText(this.processes[process].error),
                general:        this.setFormatArrayText(this.processes[process].general),
                callData:       this.setFormatArrayText(this.processes[process].callData),
                callResponse:   this.setFormatArrayText(this.processes[process].callResponse),
                createdAt:      new Date()
            });

            await alert.save({ session });

            await session.commitTransaction();
            return true;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    public setLimitWrite(limit: number): void {
        this.limitWrite = limit;
    }

    protected setFormatArrayText(results: any[]): string {
        if (!Array.isArray(results)) {
            return results;
        }

        return results.map(result => `##########\n${JSON.stringify(result, null, 2)}\n##########`).join('\n');
    }

    // Implement other methods as needed, adapting PHP functionality to TypeScript/Node.js

    private md5(input: string): string {
        // Placeholder for MD5 implementation or import
        return ''; // Replace with actual MD5 hash of input
    }

    protected getSeparator(): string {
        return '\n' + '#'.repeat(101) + '\n';
    }

    public getAlert(code: string): any[] {
        return this.processes[code]['alert'];
    }

    public setAlert(code: string, alert: any): void {
        if (Array.isArray(alert)) {
            alert = JSON.stringify(alert, null, 2);
        }
        this.processes[code]['alert'].push(alert);
    }

    public getDebug(code: string): any[] {
        return this.processes[code]['debug'];
    }

    public setDebug(code: string, debug: any, label?: string | null): void {
        if (label !== null && label !== undefined) {
            this.processes[code]['debug'].push(label);
        }

        if (Array.isArray(debug)) {
            debug = JSON.stringify(debug, null, 2);
        }
        this.processes[code]['debug'].push(debug);
    }

    public getError(code: string): any[] {
        return this.processes[code]['error'];
    }

    public setError(code: string, error: any): void {
        if (Array.isArray(error)) {
            error = JSON.stringify(error, null, 2);
        }
        this.processes[code]['error'].push(error);
    }

    public getGeneral(code: string): any[] {
        return this.processes[code]['general'];
    }

    public setGeneral(code: string, general: any): void {
        if (Array.isArray(general)) {
            general = JSON.stringify(general, null, 2);
        }
        this.processes[code]['general'].push(general);
    }

    public getCallData(code: string): any[] {
        return this.processes[code]['callData'];
    }

    public setCallData(code: string, callData: any): void {
        if (Array.isArray(callData)) {
            callData = JSON.stringify(callData, null, 2);
        }
        this.processes[code]['callData'].push(callData);
    }

    public getCallResponse(code: string): any[] {
        return this.processes[code]['callResponse'];
    }

    public setCallResponse(code: string, callResponse: any): void {
        if (Array.isArray(callResponse)) {
            callResponse = JSON.stringify(callResponse, null, 2);
        }
        this.processes[code]['callResponse'].push(callResponse);
    }

  
}

export default AlertUtility;
