import adminApi from "./adminApi";
import {
  adaptEmployeesFromDB,
  adaptEmployeeFromDB,
  adaptEmployeeForDB,
} from "../utils/dataAdapters";

export const getEmployees = async (params = {}) => {
  try {
    const response = await adminApi.get("/employees", { params });
    const employees = response.data.employees || response.data;
    return { employees: adaptEmployeesFromDB(employees) };
  } catch (error) {
    throw (
      error.response?.data || { message: "Lỗi khi tải danh sách nhân viên" }
    );
  }
};

export const createEmployee = async (employeeData) => {
  try {
    const all = await getEmployees();
    const newId = Math.max(...all.employees.map((e) => Number(e.id)), 0) + 1;

    const dataToSend = adaptEmployeeForDB({
      ...employeeData,
      id: newId,
      createdAt: new Date().toISOString(),
    });

    const response = await adminApi.post("/employees", dataToSend);
    return adaptEmployeeFromDB(response.data);
  } catch (error) {
    throw error.response?.data || { message: "Lỗi khi tạo nhân viên" };
  }
};

export const updateEmployee = async (id, employeeData) => {
  try {
    const dataToSend = adaptEmployeeForDB({
      ...employeeData,
      id,
      updatedAt: new Date().toISOString(),
    });
    const response = await adminApi.put(`/employees/${id}`, dataToSend);
    return adaptEmployeeFromDB(response.data);
  } catch (error) {
    throw error.response?.data || { message: "Lỗi khi cập nhật nhân viên" };
  }
};

export const deleteEmployee = async (id) => {
  try {
    await adminApi.delete(`/employees/${id}`);
  } catch (error) {
    throw error.response?.data || { message: "Lỗi khi xóa nhân viên" };
  }
};
