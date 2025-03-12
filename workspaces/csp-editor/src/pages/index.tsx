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
	const cspRef = React.useRef(new ContentSecurityPolicyManager());
	const csp = cspRef.current;
	const [cspValue, setCSPValue] = React.useState("");
	const [rulesTable, setRulesTable] = React.useState<
		ContentSecurityPolicyManager["rules"]
	>([]);
	const [flagsTable, setFlagsTable] = React.useState<
		ContentSecurityPolicyManager["flags"]
	>([]);

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
			if (directive && values.length > 0) {
				csp.add(directive as any, ...values);
			}
		});

		// Add all flags
		updatedFlags.forEach(([name, values]) => {
			if (name && values.length > 0) {
				csp.set(name as any, ...values);
			}
		});

		// Update state
		setCSPValue(csp.toString());
		setRulesTable(csp.rules);
		setFlagsTable(csp.flags);
	};

	// Event handlers
	const handleCSPStringChange = ({
		target: { value },
	}: React.ChangeEvent<HTMLTextAreaElement>) => {
		setCSPValue(value);
		csp.load(value);
		setRulesTable(csp.rules);
		setFlagsTable(csp.flags);
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

	const handleFlagChange = (index: number, newFlag: string) =>
		modifyFlag(index, newFlag);

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
					<textarea
						value={cspValue}
						onChange={handleCSPStringChange}
						placeholder="Enter CSP here"
						className={styles.cspTextarea}
					/>
				</header>
				<main className={styles.main}>
					<h2>Directives</h2>
					<table>
						<thead>
							<tr>
								<th>Directive</th>
								<th>Sources</th>
							</tr>
						</thead>
						<tbody>
							{rulesTable.map(([source, directives], index) => (
								<tr key={index}>
									<td>
										<input
											type="text"
											value={source}
											onChange={(e) =>
												handleDirectiveChange(index, e.target.value)
											}
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
								<th>Flag</th>
								<th>Values</th>
							</tr>
						</thead>
						<tbody>
							{flagsTable.map(([flag, values], index) => (
								<tr key={index}>
									<td>
										<input
											type="text"
											value={flag}
											onChange={(e) => handleFlagChange(index, e.target.value)}
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
