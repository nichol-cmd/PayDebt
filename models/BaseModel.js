const prisma = require('../config/database')

class BaseModel {
  constructor(namaModel) {
    this.namaModel = namaModel
    this.prisma    = prisma
  }

  async findAll(kondisi = {}) {
    return await this.prisma[this.namaModel].findMany(kondisi)
  }

  async findById(id) {
    return await this.prisma[this.namaModel].findUnique({
      where: { id: parseInt(id) }
    })
  }

  async create(data) {
    return await this.prisma[this.namaModel].create({ data })
  }

  async update(id, data) {
    return await this.prisma[this.namaModel].update({
      where: { id: parseInt(id) },
      data
    })
  }

  async delete(id) {
    return await this.prisma[this.namaModel].delete({
      where: { id: parseInt(id) }
    })
  }
}

module.exports = BaseModel
