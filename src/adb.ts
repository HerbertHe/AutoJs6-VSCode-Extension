'use strict';

import * as c_proc from 'child_process';
import * as path from 'path';

import {SpawnSyncReturns} from 'child_process';

class AbdExecError extends Error {
    constructor(result: SpawnSyncReturns<Buffer>) {
        result.status !== null
            ? super(`exited ${result.status}, stderr = ${result.stderr.toString()}, stdout = ${result.stdout.toString()}`)
            : super(`killed ${result.signal}, stderr = ${result.stderr.toString()}, stdout = ${result.stdout.toString()}`);
    }
}

export class Adb {
    private readonly prebuiltDir: string;
    private adb: string = null;

    constructor(prebuiltDir: string) {
        // 预构建目录
        this.prebuiltDir = prebuiltDir;
    }

    /** 值为地址或者 adb */
    executable(): string {
        if (this.adb === null) {
            if (process.platform.startsWith('win') && c_proc.spawnSync('adb').pid === 0) {
                // 通过预构建目录拿到文件夹下面的 adb.exe 路径
                this.adb = path.join(this.prebuiltDir, 'adb.exe');
            } else {
                // 直接使用 adb 命令
                this.adb = 'adb';
            }
        }
        return this.adb;
    }

    /** 带参数执行命令 */
    exec(args: ReadonlyArray<string>): SpawnSyncReturns<Buffer> {
        return c_proc.spawnSync(this.executable(), args);
    }

    /** 执行并抛出异常 */
    execOrThrow(args: ReadonlyArray<string>): SpawnSyncReturns<Buffer> {
        return Adb.throwsIfNeeded(this.exec(args));
    }

    /** 原样执行输出 */
    execOut(args: ReadonlyArray<string>, options: Object): SpawnSyncReturns<Buffer> {
        return c_proc.spawnSync(this.executable(), ['exec-out', ...args], Object.assign({encoding: 'buffer'}, options));
    }

    /** 原样执行输出并抛出异常 */
    execOutOrThrow(args: ReadonlyArray<string>, options: Object): SpawnSyncReturns<Buffer> {
        return Adb.throwsIfNeeded(this.execOut(args, options));
    }

    static throwsIfNeeded<T extends SpawnSyncReturns<Buffer>>(result: T): T {
        if (result.signal !== null || result.status !== 0) {
            throw new AbdExecError(result);
        }
        return result;
    }
}