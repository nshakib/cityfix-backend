
const createDepartment = async (payload: any) => {
    const result = await prisma.department.create({
        data: payload,
    });
    return result;
};