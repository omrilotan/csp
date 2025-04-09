"use client";

import Head from "next/head";
import styles from "../styles/Home.module.css";
import React from "react";
import {
	ContentSecurityPolicyManager,
	CSPDirectives,
	CSPSourceKeywords,
} from "../../../content-security-policy-manager/src";
import { CSPFlag } from "../../../content-security-policy-manager/src/types";

export default function Home() {
	// Add this state to track if textarea has been populated
	const [textareaLocked, setTextareaLocked] = React.useState(false);

	const cspRef = React.useRef(new ContentSecurityPolicyManager());
	const csp = cspRef.current;
	const [cspValue, setCSPValue] = React.useState("");
	const [rulesTable, setRulesTable] = React.useState<
		ContentSecurityPolicyManager["rules"]
	>([]);
	const [flagsTable, setFlagsTable] = React.useState<
		ContentSecurityPolicyManager["flags"]
	>([]);

	// Add this state to track temporary edits
	const [editingDirective, setEditingDirective] = React.useState<{
		index: number;
		value: string;
	} | null>(null);
	const [editingFlag, setEditingFlag] = React.useState<{
		index: number;
		value: string;
	} | null>(null);

	// Add state to track current edited value in textarea
	const [editingCspValue, setEditingCspValue] = React.useState("");

	// Add this state for notifications
	const [notification, setNotification] = React.useState<{
		message: string;
		type: "success" | "error";
	} | null>(null);

	const [isModalOpen, setIsModalOpen] = React.useState(false);
	const [exportedJson, setExportedJson] = React.useState<string>("");

	// Initialize editing value when cspValue changes
	React.useEffect(() => {
		setEditingCspValue(cspValue);
	}, [cspValue]);

	// Core update function that handles all CSP modifications
	const updateCSP = (
		newRulesTable?: ContentSecurityPolicyManager["rules"],
		newFlagsTable?: ContentSecurityPolicyManager["flags"],
	) => {
		const updatedRules = newRulesTable || rulesTable;
		const updatedFlags = newFlagsTable || flagsTable;

		csp.clear();

		// Add all valid directives
		updatedRules.forEach(([directive, values]) => {
			if (directive) {
				csp.add(directive as any, ...values);
			}
		});

		// Add all flags
		updatedFlags.forEach(([name, values]) => {
			if (name) {
				csp.set(name as any, ...values);
			}
		});

		// Update state
		setCSPValue(csp.toString());
		setRulesTable(csp.rules);
		setFlagsTable(csp.flags);
	};

	// Add a function to unlock textarea if needed
	const unlockTextarea = () => {
		setTextareaLocked(false);
	};

	// Enhanced clipboard function with visual feedback
	const copyToClipboard = () => {
		navigator.clipboard
			.writeText(cspValue)
			.then(() => {
				setNotification({ message: "Copied to clipboard!", type: "success" });
				// Auto-dismiss after 2 seconds
				setTimeout(() => setNotification(null), 2000);
			})
			.catch((err) => {
				console.error("Failed to copy:", err);
				setNotification({ message: "Failed to copy", type: "error" });
				setTimeout(() => setNotification(null), 2000);
			});
	};

	// Update textarea handlers
	const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		// Only update local state, not the CSP yet
		setEditingCspValue(e.target.value);
	};

	const handleTextareaBlur = () => {
		// Now update the CSP
		if (editingCspValue !== cspValue) {
			setCSPValue(editingCspValue);
			csp.clear().load(editingCspValue);
			setRulesTable(csp.rules);
			setFlagsTable(csp.flags);

			// Lock the textarea if it has content and isn't already locked
			if (editingCspValue.trim() && !textareaLocked) {
				setTextareaLocked(true);
			}
		}
	};

	const handleTextareaKeyDown = (
		e: React.KeyboardEvent<HTMLTextAreaElement>,
	) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault(); // Prevent default newline
			e.currentTarget.blur(); // Trigger blur to update
		}
	};

	// Rules table handlers
	const modifyRow = (
		index: number,
		newDirective?: string,
		modifyValues?: (values: string[]) => string[],
	) => {
		const updatedTable = [...rulesTable];
		const [directive, values] = updatedTable[index] || ["", []];

		// If we're only removing values and it results in an empty array, remove the row
		if (modifyValues && !newDirective) {
			const newValues = modifyValues(values);
			if (newValues.length === 0) {
				updatedTable.splice(index, 1);
				return updateCSP(updatedTable);
			}
			updatedTable[index] = [directive, newValues as typeof CSPDirectives];
		} else {
			// Otherwise update with new directive or values
			updatedTable[index] = [
				newDirective || directive,
				modifyValues ? (modifyValues as any)(values) : values,
			];
		}

		updateCSP(updatedTable);
	};

	const handleDirectiveChange = (index: number, newDirective: string) =>
		modifyRow(index, newDirective);

	const handleValueDelete = (rowIndex: number, valueIndex: number) =>
		modifyRow(rowIndex, undefined, (values) => {
			const newValues = [...values];
			newValues.splice(valueIndex, 1);
			return newValues;
		});

	const handleValueAdd = (rowIndex: number, newValue: string) => {
		if (!newValue.trim()) return;
		modifyRow(rowIndex, undefined, (values) => [...values, newValue.trim()]);
	};

	// Flag table handlers
	const modifyFlag = (
		index: number,
		newFlag?: string,
		modifyValues?: (values: any[]) => any[],
	) => {
		const updatedFlags = [...flagsTable];
		const [flag, values] = updatedFlags[index] || ["", []];

		// If we're only removing values and it results in an empty array, remove the row
		if (modifyValues && !newFlag) {
			const newValues = modifyValues(values);
			if (newValues.length === 0) {
				updatedFlags.splice(index, 1);
				return updateCSP(undefined, updatedFlags);
			}
			updatedFlags[index] = [flag, newValues];
		} else {
			// Otherwise update with new flag or values
			updatedFlags[index] = [
				(newFlag as CSPFlag) || flag,
				modifyValues ? modifyValues(values) : values,
			];
		}

		updateCSP(undefined, updatedFlags);
	};

	const handleFlagChange = (index: number, newFlag: string) => {
		if (newFlag === "") {
			// Remove the row if flag name is empty
			const updatedFlags = [...flagsTable];
			updatedFlags.splice(index, 1);
			return updateCSP(undefined, updatedFlags);
		}

		// Otherwise update with new flag name
		return modifyFlag(index, newFlag);
	};

	const handleFlagValueDelete = (rowIndex: number, valueIndex: number) =>
		modifyFlag(rowIndex, undefined, (values) => {
			const newValues = [...values];
			newValues.splice(valueIndex, 1);
			return newValues;
		});

	const handleFlagValueAdd = (rowIndex: number, newValue: string) => {
		if (!newValue.trim()) return;
		modifyFlag(rowIndex, undefined, (values) => [...values, newValue.trim()]);
	};

	const exportCSP = () => {
		const cspJson = csp.toTable(); // Use the toTable method
		setExportedJson(JSON.stringify(cspJson, null, 2)); // Format JSON with indentation
		setIsModalOpen(true); // Open the modal
	};

	const copyExportedJsonToClipboard = () => {
		navigator.clipboard
			.writeText(exportedJson)
			.then(() => {
				setNotification({
					message: "Exported JSON copied to clipboard!",
					type: "success",
				});
				setTimeout(() => setNotification(null), 2000); // Auto-dismiss after 2 seconds
			})
			.catch((err) => {
				console.error("Failed to copy:", err);
				setNotification({ message: "Failed to copy JSON", type: "error" });
				setTimeout(() => setNotification(null), 2000);
			});
	};

	return (
		<>
			<Head>
				<title>CSP Editor</title>
				<meta name="description" content="Edit CSP" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<link rel="icon" href="/favicon.ico" />
			</Head>
			<div className={styles.page}>
				<header className={styles.stickyHeader}>
					<div className={styles.headerTitleRow}>
						<h1>CSP Editor</h1>
						<div className={styles.infoIconContainer}>
							<span className={styles.infoIcon}>i</span>
							<span className={styles.tooltip}>
								&nbsp;Experimental tool using{" "}
								<a
									href="https://www.npmjs.com/package/content-security-policy-manager"
									rel="noopener noreferrer"
								>
									content-security-policy-manager
								</a>{" "}
								for editing CSP headers with a sources-first approach.
							</span>
						</div>
					</div>
					<div className={styles.textareaContainer}>
						<textarea
							value={editingCspValue}
							onChange={handleTextareaChange}
							onBlur={handleTextareaBlur}
							onKeyDown={handleTextareaKeyDown}
							placeholder="Enter CSP here"
							className={styles.cspTextarea}
							readOnly={textareaLocked} // Add readonly attribute when locked
						/>
						{textareaLocked && (
							<div className={styles.textareaButtons}>
								<button
									onClick={copyToClipboard}
									className={styles.actionButton}
									title="Copy CSP to clipboard"
								>
									Copy
								</button>
								<button
									onClick={unlockTextarea}
									className={styles.actionButton}
									title="Edit CSP string directly"
								>
									Edit
								</button>
								<button
									onClick={exportCSP}
									className={styles.actionButton}
									title="Export CSP JSON structure"
								>
									Export
								</button>
							</div>
						)}
						{notification && (
							<div
								className={`${styles.notification} ${styles[notification.type]}`}
							>
								{notification.message}
							</div>
						)}
					</div>
				</header>
				<main className={styles.main}>
					<h2>Directives</h2>
					<table>
						<thead>
							<tr>
								<th>Source</th>
								<th>Directives</th>
							</tr>
						</thead>
						<tbody>
							{rulesTable.map(([source, directives], index) => (
								<tr key={source}>
									<td>
										<input
											type="text"
											value={
												editingDirective && editingDirective.index === index
													? editingDirective.value
													: source
											}
											onChange={(e) => {
												// Just update the temporary state, not the CSP yet
												setEditingDirective({ index, value: e.target.value });
											}}
											onBlur={() => {
												// Only now update the CSP
												if (
													editingDirective &&
													editingDirective.index === index
												) {
													handleDirectiveChange(index, editingDirective.value);
													setEditingDirective(null);
												}
											}}
											onKeyDown={(e) => {
												if (e.key === "Enter") {
													e.preventDefault();
													e.currentTarget.blur();
												}
											}}
											placeholder="Source"
										/>
									</td>
									<td>
										<ValueBlocksEditor
											name="directive"
											values={directives}
											onValueAdd={(val) => handleValueAdd(index, val)}
											onValueDelete={(valIndex) =>
												handleValueDelete(index, valIndex)
											}
										/>
									</td>
								</tr>
							))}
						</tbody>
					</table>
					<button
						onClick={() => setRulesTable([...rulesTable, ["", []]])}
						className={styles.addButton}
					>
						Add Directive
					</button>

					<h2>Flags</h2>
					<table>
						<thead>
							<tr>
								<th>Directive</th>
								<th>Values</th>
							</tr>
						</thead>
						<tbody>
							{flagsTable.map(([flag, values], index) => (
								<tr key={flag}>
									<td>
										<input
											type="text"
											value={
												editingFlag && editingFlag.index === index
													? editingFlag.value
													: flag
											}
											onChange={(e) => {
												// Just update the temporary state, not the CSP yet
												setEditingFlag({ index, value: e.target.value });
											}}
											onBlur={() => {
												// Only now update the CSP
												if (editingFlag && editingFlag.index === index) {
													handleFlagChange(index, editingFlag.value);
													setEditingFlag(null);
												}
											}}
											onKeyDown={(e) => {
												if (e.key === "Enter") {
													e.preventDefault();
													e.currentTarget.blur();
												}
											}}
											placeholder="Flag name"
										/>
									</td>
									<td>
										<ValueBlocksEditor
											name="value"
											values={values}
											onValueAdd={(val) => handleFlagValueAdd(index, val)}
											onValueDelete={(valIndex) =>
												handleFlagValueDelete(index, valIndex)
											}
										/>
									</td>
								</tr>
							))}
						</tbody>
					</table>
					<button
						onClick={() => setFlagsTable([...(flagsTable as any), ["", []]])}
						className={styles.addButton}
					>
						Add Flag
					</button>
				</main>
				{isModalOpen && (
					<div className={styles.modalOverlay}>
						<div className={styles.modal}>
							<h2>Exported CSP JSON</h2>
							<textarea
								value={exportedJson}
								readOnly
								className={styles.jsonTextarea}
							/>
							<div className={styles.modalButtons}>
								<button
									onClick={copyExportedJsonToClipboard}
									className={styles.actionButton}
								>
									Copy to Clipboard
								</button>
								<button
									onClick={() => setIsModalOpen(false)}
									className={styles.closeButton}
								>
									Close
								</button>
							</div>
						</div>
					</div>
				)}
			</div>
		</>
	);
}

// Simplified ValueBlocksEditor component
const ValueBlocksEditor: React.FC<{
	name: string;
	values: string[];
	onValueAdd: (value: string) => void;
	onValueDelete: (index: number) => void;
}> = ({ name, values, onValueAdd, onValueDelete }) => {
	const [inputValue, setInputValue] = React.useState("");
	const inputRef = React.useRef<HTMLInputElement>(null);

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			if (inputValue.trim()) {
				onValueAdd(inputValue);
				setInputValue("");
			}
		}
	};

	const handleBlur = () => {
		if (inputValue.trim()) {
			onValueAdd(inputValue);
			setInputValue("");
		}
	};

	return (
		<div
			className={styles.valueBlocksContainer}
			onClick={() => inputRef.current?.focus()}
		>
			{values.map((val, idx) => (
				<span key={idx} className={styles.valueBlock}>
					{val}
					<button
						className={styles.deleteValueBtn}
						onClick={(e) => {
							e.stopPropagation();
							onValueDelete(idx);
						}}
					>
						×
					</button>
				</span>
			))}
			<div className={styles.inputContainer}>
				<input
					ref={inputRef}
					type="text"
					value={inputValue}
					onChange={(e) => setInputValue(e.target.value)}
					onKeyDown={handleKeyDown}
					onBlur={handleBlur}
					placeholder={`Add ${name}${values.length ? "" : "s"}…`}
					className={styles.valueInput}
				/>
			</div>
		</div>
	);
};
