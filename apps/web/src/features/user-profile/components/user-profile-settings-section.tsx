import { useUploadFile } from "@better-upload/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { userQueries } from "@/features/user/user.queries";
import { buildR2PublicUrl } from "@/lib/r2-public-url";
import { getProblemDetailsStatus, ProblemDetailsError } from "@/shared/errors";
import {
	toCreateUserProfileDto,
	toUpdateUserProfileDto,
	type UserProfileDirtyValues,
	type UserProfileFormValues,
	userProfileToFormValues,
} from "../schemas/user-profile-form.schema";
import {
	useCreateUserProfile,
	useUpdateUserProfile,
	useUserProfile,
} from "../user-profile.queries";
import { UserProfileForm } from "./user-profile-form";

export function UserProfileSettingsSection() {
	const { data: currentUser } = useSuspenseQuery(userQueries.me());
	const profileQuery = useUserProfile(currentUser.id, {
		retry: false,
	});
	const { mutateAsync: createUserProfile, isPending: isCreating } =
		useCreateUserProfile();
	const { mutateAsync: updateUserProfile, isPending: isUpdating } =
		useUpdateUserProfile();
	const signatureUploader = useUploadFile({
		api: "/api/branding-upload",
		route: "userSignature",
	});
	const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	if (profileQuery.isPending) {
		return (
			<Card>
				<CardContent>
					<p className="text-sm text-muted-foreground">Cargando perfil...</p>
				</CardContent>
			</Card>
		);
	}

	const isProfileMissing = getProblemDetailsStatus(profileQuery.error) === 404;

	if (profileQuery.isError && !isProfileMissing) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>No pudimos cargar el perfil</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-destructive">
						{profileQuery.error instanceof ProblemDetailsError
							? profileQuery.error.problemDetails.detail
							: "Ocurrio un error cargando el perfil del titular."}
					</p>
				</CardContent>
			</Card>
		);
	}

	const mode = isProfileMissing || !profileQuery.data ? "create" : "update";
	const defaultValues = userProfileToFormValues(profileQuery.data);
	const formKey = JSON.stringify({
		mode,
		fullName: defaultValues.fullName,
		documentNumber: defaultValues.documentNumber,
		phone: defaultValues.phone,
		address: defaultValues.address,
		signUrl: defaultValues.signUrl,
	});

	return (
		<UserProfileForm
			key={formKey}
			defaultValues={defaultValues}
			mode={mode}
			isPending={isCreating || isUpdating || signatureUploader.isPending}
			feedbackMessage={feedbackMessage}
			errorMessage={errorMessage}
			onSubmit={async ({ values, dirtyValues }) => {
				await handleSubmit({
					currentUserId: currentUser.id,
					mode,
					values,
					dirtyValues,
					createUserProfile,
					updateUserProfile,
					signatureUploader,
					setFeedbackMessage,
					setErrorMessage,
				});
			}}
		/>
	);
}

async function handleSubmit({
	currentUserId,
	mode,
	values,
	dirtyValues,
	createUserProfile,
	updateUserProfile,
	signatureUploader,
	setFeedbackMessage,
	setErrorMessage,
}: {
	currentUserId: string;
	mode: "create" | "update";
	values: UserProfileFormValues;
	dirtyValues: UserProfileDirtyValues;
	createUserProfile: (variables: {
		userId: string;
		dto: ReturnType<typeof toCreateUserProfileDto>;
	}) => Promise<unknown>;
	updateUserProfile: (variables: {
		userId: string;
		dto: ReturnType<typeof toUpdateUserProfileDto>;
	}) => Promise<void>;
	signatureUploader: ReturnType<typeof useUploadFile>;
	setFeedbackMessage: (message: string | null) => void;
	setErrorMessage: (message: string | null) => void;
}) {
	setFeedbackMessage(null);
	setErrorMessage(null);

	try {
		let signUrl = values.signUrl;

		if (values.signatureFile) {
			const preparedSignature = await compressSignatureFile(
				values.signatureFile,
			);
			const uploadResult =
				await signatureUploader.uploadAsync(preparedSignature);
			const uploadedSignUrl = buildR2PublicUrl(
				uploadResult.file.objectInfo.key,
				"branding",
			);

			if (!uploadedSignUrl) {
				throw new Error("No pudimos generar la URL publica de la firma.");
			}

			signUrl = uploadedSignUrl;
		}

		if (mode === "create") {
			await createUserProfile({
				userId: currentUserId,
				dto: toCreateUserProfileDto({
					fullName: values.fullName,
					documentNumber: values.documentNumber,
					phone: values.phone,
					address: values.address,
					signUrl,
				}),
			});

			setFeedbackMessage("Perfil guardado correctamente.");
			return;
		}

		const nextDirtyValues: UserProfileDirtyValues = { ...dirtyValues };

		if (values.signatureFile) {
			nextDirtyValues.signUrl = signUrl;
		}

		const dto = toUpdateUserProfileDto(nextDirtyValues);

		if (Object.keys(dto).length === 0) {
			setFeedbackMessage("No hay cambios para guardar.");
			return;
		}

		await updateUserProfile({
			userId: currentUserId,
			dto,
		});

		setFeedbackMessage("Perfil actualizado correctamente.");
	} catch (error) {
		if (error instanceof ProblemDetailsError) {
			setErrorMessage(error.problemDetails.detail);
			return;
		}

		setErrorMessage(
			error instanceof Error
				? error.message
				: "No pudimos guardar el perfil del titular.",
		);
	}
}

async function compressSignatureFile(file: File): Promise<File> {
	const { default: imageCompression } = await import(
		"browser-image-compression"
	);

	const compressed = await imageCompression(file, {
		maxWidthOrHeight: 1200,
		fileType: "image/png",
		initialQuality: 0.82,
		maxSizeMB: 3,
	});

	return new File([compressed], file.name.replace(/\.[^.]+$/, ".png"), {
		type: "image/png",
	});
}
