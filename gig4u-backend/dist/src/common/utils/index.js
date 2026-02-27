"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPaginationMeta = exports.calculateSkip = void 0;
const calculateSkip = (page, limit) => (page - 1) * limit;
exports.calculateSkip = calculateSkip;
const createPaginationMeta = (total, page, limit) => ({
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNextPage: page * limit < total,
    hasPreviousPage: page > 1,
});
exports.createPaginationMeta = createPaginationMeta;
//# sourceMappingURL=index.js.map