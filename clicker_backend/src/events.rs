use sqlx::PgPool;
use crate::sql_queries::fill_event_table;

#[derive(sqlx::Type)]
#[sqlx(type_name = "event_type", rename_all = "lowercase")]
pub enum EventType {
    Daily,
    Weekly,
    Seasonal,
}

pub async fn daily_event(pool: &PgPool) {
    let daily_events = create_events(EventType::Daily);
    fill_event_table(daily_events, EventType::Daily, pool).await;
}

fn create_events(event_type: EventType) -> Vec<&'static str> {
    let daily_event_vec = vec!["Mine {} ores.", "Collect {} number of diamonds.", "Dig {} deep into the ground"];
    let weekly_event_vec = vec!["Mine {} ores.", "Collect {} number of diamonds.", "Dig {} deep into the ground"];
    let seasonal_event_vec = vec!["Mine {} ores.", "Collect {} number of diamonds.", "Dig {} deep into the ground"];
    match event_type {
        EventType::Daily => daily_event_vec.to_vec(),
        EventType::Weekly => weekly_event_vec.to_vec(),
        EventType::Seasonal => seasonal_event_vec.to_vec(),
    }
}