export const getShareUrl = (shareId: string): string => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/shared/${shareId}`;
}; 