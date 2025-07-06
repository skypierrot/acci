import { relations } from "drizzle-orm/relations";
import { company, site, occurrence_report, investigation_report, victims } from "./schema";

export const siteRelations = relations(site, ({one}) => ({
	company: one(company, {
		fields: [site.company_id],
		references: [company.id]
	}),
}));

export const companyRelations = relations(company, ({many}) => ({
	sites: many(site),
}));

export const investigation_reportRelations = relations(investigation_report, ({one}) => ({
	occurrence_report: one(occurrence_report, {
		fields: [investigation_report.accident_id],
		references: [occurrence_report.accident_id]
	}),
}));

export const occurrence_reportRelations = relations(occurrence_report, ({many}) => ({
	investigation_reports: many(investigation_report),
	victims: many(victims),
}));

export const victimsRelations = relations(victims, ({one}) => ({
	occurrence_report: one(occurrence_report, {
		fields: [victims.accident_id],
		references: [occurrence_report.accident_id]
	}),
}));