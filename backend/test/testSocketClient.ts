import { Socket, io as socketIOClient } from 'socket.io-client';

class TestSocketClick {
    private params: { [key: string]: string };
    private numConnectedClient: number;
    private numMaxClient: number;
    private numClient: number;
    private timeInterval: number;
    private host: string;
    // private interval: NodeJS.Timer;

    constructor() {
        this.params = {};
        this.numConnectedClient = 1;
        this.numMaxClient = 1;
        this.numClient = 1;
        this.timeInterval = 1;
        this.host = 'ws://79.53.22.202:3001';

        process.argv.forEach((val) => {
            const param = val.split('=');
            this.params[param[0]] = param.length > 1 ? param[1] : '';
        });

        this.controlParameters();

        this.timeInterval *= 1000;

        this.init();
        // this.interval = setInterval(() => {
        //     console.info('intervallo');
        //     this.init();
        // }, this.timeInterval);
    }

    private controlParameters(): void {
        if (this.params['numClient']) {
            this.numClient = parseInt(this.params['numClient']);
        }
        if (this.params['numMaxClient']) {
            this.numMaxClient = parseInt(this.params['numMaxClient']);
        }
        if (this.params['timeInterval']) {
            this.timeInterval = parseInt(this.params['timeInterval']);
        }
        if (this.params['host']) {
            this.host = this.params['host'];
        }
    }

    private init(): void {
        for (let x = 0; x < this.numClient; x++) {
            this.connectClient(x);
        }
    }

    private connectClient(client: number): void {
        console.info('eccomi: ');
        let clientNumber = this.numConnectedClient;
        if (this.numConnectedClient >= this.numMaxClient) {
            // clearInterval(this.interval as unknown as number);
            // console.info('clearInterval');
        }
        this.numConnectedClient++;

        const socket: Socket = socketIOClient(this.host);
        socket.on('connect', () => {
            console.info('Client connesso: ' + clientNumber);
        });
        socket.on('dataLive', (data) => {
            console.info('Client Riceve data' + data);
        });
        socket.on('disconnect', () => {
            console.info('Client Disconnesso' + clientNumber);
            this.connectClient(clientNumber);
        });
    }
}

new TestSocketClick();
