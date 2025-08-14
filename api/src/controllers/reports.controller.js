// api/src/controllers/reports.controller.js
const reportsService = require("../services/reports.service");

class ReportsController {
  async getDashboardReports(req, res, next) {
    try {
      const data = await reportsService.getDashboardReports();
      res.json(data);
    } catch (error) {
      next(error);
    }
  }
}
module.exports = new ReportsController();
