import { NextResponse } from "next/server";
import { requireAdminSession } from "../../../auth/require-session";
import { AdminApiError, AdminUnauthorizedError } from "../../../medusa/errors";
import {
	createCmsPresignedUpload,
	formatCmsUploadError,
} from "../../../storage/upload";

export const runtime = "nodejs";

type PresignBody = {
	filename?: string;
	contentType?: string;
	size?: number;
};

/** Route Handler POST presign — montuj w `app/api/…/cms-upload/presign/route.ts`. */
export async function handleCmsUploadPresignPost(request: Request): Promise<Response> {
	try {
		await requireAdminSession();

		const body = (await request.json()) as PresignBody;
		const filename = body.filename?.trim();
		const contentType = body.contentType?.trim() ?? "";
		const size = body.size;

		if (!filename || typeof size !== "number") {
			return NextResponse.json({ error: "Brak nazwy pliku lub rozmiaru." }, { status: 400 });
		}

		const result = await createCmsPresignedUpload({ filename, contentType, size });
		return NextResponse.json({ ...result, error: null });
	} catch (error) {
		if (error instanceof AdminUnauthorizedError) {
			return NextResponse.json({ error: "Sesja wygasła — zaloguj się ponownie." }, { status: 401 });
		}
		if (error instanceof AdminApiError) {
			return NextResponse.json(
				{ error: error.message },
				{ status: error.status >= 500 ? 503 : error.status },
			);
		}

		const message = formatCmsUploadError(error);
		console.error("[cms-upload/presign]", error);
		return NextResponse.json({ error: message }, { status: 500 });
	}
}

export { handleCmsUploadPresignPost as POST };
