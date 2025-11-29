"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeSwitcher from "./ThemeSwitcher";
import { HomeIcon, PlusIcon, PencilIcon, TrashIcon, BookmarkIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface NavbarProps {
	onSaveShare?: () => void;
	onShowMetadata?: () => void;
	isSaving?: boolean;
	// Project view actions
	onEdit?: () => void;
	onDelete?: () => void;
	onCancelEdit?: () => void;
	onSaveEdit?: () => void;
	isDeleting?: boolean;
	isEditMode?: boolean;
}

export default function Navbar({
	onSaveShare,
	onShowMetadata,
	isSaving,
	onEdit,
	onDelete,
	onCancelEdit,
	onSaveEdit,
	isDeleting,
	isEditMode
}: NavbarProps) {
	const pathname = usePathname();
	const isHomePage = pathname === "/";
	const isViewPage = pathname?.startsWith("/paste/") || pathname?.startsWith("/project/");
	const isPrivacyPage = pathname === "/privacy" || pathname?.startsWith("/privacy/");
	const showEditorButtons = !isHomePage && !isViewPage && !isPrivacyPage;

	return (
		<div className="navbar bg-base-100 shrink-0 shadow-none gap-4 sm:mr-20 py-3 sm:py-4">
			<div className="navbar-start w-auto">
				<Link href="/" className="btn btn-ghost rounded-xl gap-2 sm:gap-3 h-auto p-2 sm:p-1 flex-col sm:flex-row">
					<img src="/djs.png" alt="discord.js" className="w-8 sm:w-10 h-8 sm:h-10 rounded-lg" />
					<h1 className="text-base sm:text-xl font-bold text-base-content">discord.js Code Bin</h1>
				</Link>
				{/* Controls placed next to branding for tighter grouping */}
				<div className="flex items-center gap-2 sm:gap-3 ml-3 overflow-visible">
					<ThemeSwitcher />

					{/* Editor page buttons (Save/Metadata) */}
					{showEditorButtons && (
						<>
							<div className="tooltip tooltip-bottom" data-tip="Edit project metadata">
								<button
									onClick={onShowMetadata}
									className="btn rounded-xl gap-2 sm:gap-3 h-auto p-2 sm:p-3 flex-col sm:flex-row"
									aria-label="Edit project metadata"
								>
									<div className="flex flex-col items-center gap-2 sm:flex-row">
										<PencilIcon className="size-6" />

										<span className="hidden sm:inline">Metadata</span>
									</div>
								</button>
							</div>

							<div className="tooltip tooltip-bottom" data-tip="Save and share your project">
								<button
									onClick={onSaveShare}
									disabled={isSaving}
									className="btn btn-primary rounded-xl gap-2 sm:gap-3 h-auto p-2 sm:p-3 flex-col sm:flex-row"
									aria-label="Save and share your project"
								>
									<div className="flex flex-col items-center gap-2 sm:flex-row">
										<PlusIcon className="size-6" />

										<span className="hidden sm:inline">{isSaving ? "Saving..." : "Save"}</span>
									</div>
								</button>
							</div>
						</>
					)}

					{/* Project view actions: Edit/Delete (or Cancel/Save when editing) */}
					{isViewPage && (
						<div className="flex items-center gap-2">
							{!isEditMode ? (
								<>
									<div className="tooltip tooltip-bottom" data-tip="Edit project">
										<button onClick={onEdit} className="btn btn-primary rounded-xl" aria-label="Edit project">
											<span className="flex sm:flex-row gap-1.5 items-center">
												<PencilIcon className="size-6" />
												Edit
											</span>

											<span className="sm:hidden">
												<PencilIcon className="size-4" />
											</span>
										</button>
									</div>

									<div className="tooltip tooltip-bottom" data-tip="Delete project">
										<button
											onClick={onDelete}
											disabled={isDeleting}
											className="btn btn-error rounded-xl"
											aria-label="Delete project"
										>
											{isDeleting ? (
												<>
													<span className="loading loading-spinner loading-sm"></span>
													Deleting...
												</>
											) : (
												<>
													<span className="text-white flex sm:flex-row gap-1.5 items-center">
														<TrashIcon className="size-6" />
														Delete
													</span>

													<span className="sm:hidden">
														<TrashIcon className="size-4" />
													</span>
												</>
											)}
										</button>
									</div>
								</>
							) : (
								<>
									<button onClick={onCancelEdit} className="btn btn-ghost rounded-xl">
										<div className="flex flex-row gap-2 items-center">
											<XMarkIcon className="size-6" />

											<span>Cancel</span>
										</div>
									</button>

									<button onClick={onSaveEdit} disabled={isSaving} className="btn btn-primary rounded-xl">
										<div className="flex flex-row gap-2 items-center">
											<BookmarkIcon className="size-6" />

											<span>{isSaving ? "Saving..." : "Save"}</span>
										</div>
									</button>
								</>
							)}
						</div>
					)}
				</div>
			</div>

			<div className="navbar-center" />

			<div className="navbar-end"></div>
		</div>
	);
}
