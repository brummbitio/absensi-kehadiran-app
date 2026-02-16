export const mockQuery = jest.fn();
export const mockRelease = jest.fn();
export const mockGetConnection = jest.fn().mockResolvedValue({
    query: mockQuery,
    release: mockRelease,
});

export const pool = {
    query: mockQuery,
    getConnection: mockGetConnection,
};
