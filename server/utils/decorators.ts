import { performance } from 'perf_hooks';

export function MeasurePerformance() {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = function (...args: any[]) {
            const start = performance.now();
            const result = originalMethod.apply(this, args);
            const finish = performance.now();
            console.log(`[Audit] ${propertyKey} executed in ${(finish - start).toFixed(4)} ms`);
            return result;
        };
        return descriptor;
    };
}
