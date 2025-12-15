import loginData from '@/assets/login_clean.json';

/**
 * 根据员工的 IP 地址 (sip) 查找所有状态为 'error' 的登录记录。
 * @param {string} employeeIp - 员工的 IP 地址 (作为源 IP sip)。
 * @returns {Array} - 包含越权操作日志记录的数组。
 */
export function getEmployeeLoginErrorData(employeeIp) {
    if (!employeeIp) {
        return [];
    }


    // 过滤出所有 sip 与员工 IP 匹配，且 state 为 'error' 的记录
    const errorLogs = loginData.filter(log =>
        log.sip === employeeIp && log.state === 'error'
    );

    // 按照时间降序排列，以便最新记录在前 (可选)
    errorLogs.sort((a, b) => new Date(b.time) - new Date(a.time));

    return errorLogs;
}