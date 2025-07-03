// packages/shared/src/types/jobs.ts

export interface CatalogJob {
    job_id: string;
    organization_id: string;
    user_id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    image_urls: {
        cover_url?: string;
        title_page_url?: string;
        copyright_page_url?: string;
    };
    extracted_data: any | null;
    error_message: string | null;
    created_at: string;
}