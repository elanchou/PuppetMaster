"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const uuid_1 = require("uuid");
const router = (0, express_1.Router)();
// 模拟数据存储
let errorRecords = [
    {
        id: (0, uuid_1.v4)(),
        timestamp: new Date().toISOString(),
        selector: '#login-button',
        action: 'click',
        error: '元素未找到或不可点击',
        attempts: [
            {
                selector: '#login-btn',
                success: false,
                timestamp: new Date(Date.now() - 3600000).toISOString()
            }
        ],
        status: 'pending'
    },
    {
        id: (0, uuid_1.v4)(),
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        selector: 'input[name="username"]',
        action: 'fill',
        error: '元素不可见',
        attempts: [
            {
                selector: 'input#username',
                success: true,
                timestamp: new Date(Date.now() - 82800000).toISOString()
            }
        ],
        status: 'fixed'
    },
    {
        id: (0, uuid_1.v4)(),
        timestamp: new Date(Date.now() - 172800000).toISOString(),
        selector: '.submit-form button',
        action: 'click',
        error: '元素被其他元素遮挡',
        attempts: [
            {
                selector: '.submit-form button:last-child',
                success: false,
                timestamp: new Date(Date.now() - 169200000).toISOString()
            },
            {
                selector: '.submit-form > button[type="submit"]',
                success: false,
                timestamp: new Date(Date.now() - 165600000).toISOString()
            },
            {
                selector: 'button.submit-btn',
                success: false,
                timestamp: new Date(Date.now() - 162000000).toISOString()
            }
        ],
        status: 'failed'
    }
];
// 获取所有错误记录
router.get('/', (_req, res) => {
    res.json(errorRecords);
});
// 添加新的错误记录
router.post('/', (req, res) => {
    const { selector, action, error } = req.body;
    const newError = {
        id: (0, uuid_1.v4)(),
        timestamp: new Date().toISOString(),
        selector,
        action,
        error,
        attempts: [],
        status: 'pending'
    };
    errorRecords.push(newError);
    res.status(201).json(newError);
});
// 重试修复错误
router.post('/:id/retry', async (req, res) => {
    const { id } = req.params;
    const errorRecord = errorRecords.find(e => e.id === id);
    if (!errorRecord) {
        return res.status(404).json({ message: '错误记录不存在' });
    }
    // 模拟AI重试过程
    const success = Math.random() > 0.5;
    const newSelector = success ? `${errorRecord.selector}_fixed` : `${errorRecord.selector}_failed`;
    errorRecord.attempts.push({
        selector: newSelector,
        success,
        timestamp: new Date().toISOString()
    });
    if (success) {
        errorRecord.status = 'fixed';
    }
    else if (errorRecord.attempts.length >= 3) {
        errorRecord.status = 'failed';
    }
    res.json(errorRecord);
});
// 自定义修复错误
router.post('/:id/fix', (req, res) => {
    const { id } = req.params;
    const { selector } = req.body;
    const errorRecord = errorRecords.find(e => e.id === id);
    if (!errorRecord) {
        return res.status(404).json({ message: '错误记录不存在' });
    }
    errorRecord.attempts.push({
        selector,
        success: true,
        timestamp: new Date().toISOString()
    });
    errorRecord.status = 'fixed';
    res.json(errorRecord);
});
exports.default = router;
